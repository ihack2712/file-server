// Imports
import type {
	KindResponse,
	Request,
	Response
} from "./types.ts";
import {
	serve,
	serveTLS,
	resolve, extname, join,
	ms,
	renderFileToString,
	html
} from "./deps.ts";
import { Cache } from "./Cache.ts";
import { Logger } from "./Logger.ts";
import {
	canRead,
	fileType,
	toReadableSize
} from "./util.ts";
import { bundle } from "./bundler.ts";

async function findIndexInDirectory (path: string, indexes: string[]): Promise<string | void>
{
	if (await canRead(path))
	{
		const stat = await Deno.lstat(path);
		if (stat.isDirectory)
		{
			for (let indexFile of indexes)
			{
				const p = await findIndexInDirectory(resolve(join(path, indexFile)), indexes);
				if (p) return p;
			}
		} else
		{
			return path;
		}
	}
}

async function getEntries (dir: string): Promise<({ name: string, size?: string })[]>
{
	const directories: ({ name: string })[] = [ ];
	const files: ({ name: string, size: string })[] = [ ];
	for await (let entry of Deno.readDir(dir))
	{
		if (entry.isFile) files.push({
			name: entry.name,
			size: toReadableSize((await Deno.lstat(join(dir, entry.name))).size)
		});
		if (entry.isDirectory) directories.push({ name: entry.name });
	}
	return [
		{ name: "." },
		{ name: ".." },
		...directories.sort((a, b) => a.name.localeCompare(b.name)),
		...files.sort((a, b) => a.name.localeCompare(b.name))
	];
}

async function indexDirectory (req: Request)
{
	const body = html`
<!DOCTYPE html5>
<html>
	<head>
		<meta charset="UTF-8" />
		<title>${req.url.pathname}</title>
	</head>
	<body>
		<h1>Directory Listing</h1>
		<p>${req.url.pathname}</p>
		<ul>
			${(await getEntries(req.path)).map(entry => `<li><a href="${resolve(join(req.url.pathname, entry.name))}">${entry.name}</a>${entry.size !== undefined ? ` (${entry.size})` : ""}</li>`).join("")}
		</ul>
	</body>
</html>
`;
	await req.respond({
		body,
		status: 200,
		headers: {
			"Content-Type": fileType("_.html")
		}
	});
}

export async function server (
	{
		directory,
		port, host,
		cert, key,
		cache, lifetime, cors, indexing, indexes,
		ejs, typescript,
		logging, debug, colors
	}: {
		directory: string,
		port: number, host: string,
		cert?: string, key?: string,
		cache: boolean, lifetime: number, cors: boolean, indexing: boolean, indexes: string[],
		ejs: boolean, typescript: boolean,
		logging: boolean, debug: boolean, colors: boolean
	}
) {
	// Init.
	const logger = new Logger({ colors, debug, output: logging });
	const cached = new Cache(cache, lifetime);
	
	// Verify that the directory is readable and
	// is indeed a directory.
	if (!await canRead(directory))
	{
		logger.error("Cannot read from directory %s", directory);
		Deno.exit(1);
	}
	if (!(await Deno.lstat(directory)).isDirectory)
	{
		logger.error("Path must be a directory!");
		Deno.exit(1);
	}
	
	// Verify that both cert and key is readable.
	let useTLS: boolean = false;
	if (cert || key)
	{
		if (cert === "" || key === "")
		{
			logger.error("Both cert and key must be defined to use TLS!");
			Deno.exit(1)
		}
		if (!await canRead(cert!))
		{
			logger.error("Cannot read certificate file!");
			Deno.exit(1);
		}
		if (!await canRead(key!))
		{
			logger.error("Cannot read key file!");
			Deno.exit(1);
		}
		useTLS = true;
	}
	
	// Create a server object.
	const s = !useTLS
		? serve({ port, hostname: host })
		: serveTLS({ port, hostname: host, certFile: cert!, keyFile: key! });
	
	// Address details.
	const _host: string = (s.listener.addr as any).hostname;
	const _port: number = (s.listener.addr as any).port;
	const _usePort = (useTLS && _port !== 443) || (!useTLS && _port !== 80);
	const _origin: string =
		"http" + (useTLS ? "s" : "") + "://" + _host + (_usePort ? ":" + _port : "");
	logger.info("Server listening on %s", _origin);
	
	// Listen for requests.
	for await (let _request of s)
	{
		const start = Date.now();
		
		// Build a new request object.
		const req: Request = _request as any as Request;
		req.url = new URL(_origin + _request.url);
		req.path = resolve(join(directory, resolve("/", req.url.pathname)));
		req.__respond__ = _request.respond;
		let hasResponded: boolean = false;
		req.respond = async (response: KindResponse) => {
			if (hasResponded) throw new Error("A response has already been sent!");
			hasResponded = true;
			if (!(response.headers instanceof Headers))
			{
				if (typeof response.headers === "object" && response.headers !== null)
				{
					const h = new Headers();
					for (let key in response.headers!)
						h.set(key, (response.headers as any)![key]!);
					response.headers = h;
				} else
				{
					response.headers = new Headers();
				}
			}
			response.headers.set("Content-Length", response.body?.toString().length.toString() || "".length.toString());
			if (cors)
				response.headers.set("Access-Control-Allow-Origin", req.headers.get("origin") || req.headers.get("Origin") || "*");
			if (response.cache === true)
			{
				response.cache = true;
				cached.save(req, response as Response);
			}
			const _ = ms(Date.now() - start) as string;
			if (response.body instanceof Uint8Array) response.body = response.body.reduce((str, char) => str += String.fromCharCode(char), "");
			const sizeStr = debug ? " (" + toReadableSize((response.body as string || "").length) + ")" : "";
			await req.__respond__({
				body: response.body,
				headers: response.headers,
				status: response.status,
				trailers: response.trailers
			}).then(() => {
				logger.info(
					"%s %s %d %s %s%s" + ((response.status!||0) >= 500 ? " - %s" : ""),
					...[
						req.method,
						(req.conn.remoteAddr as any).hostname,
						response.status || 200,
						_, req.url.pathname,
						sizeStr,
						...((response.status!||0) >= 500 ? [ response.body! ] : [])
					]
				);
			}).catch(error => {
				logger.error(
					"%s %s %d %s %s%s - %s",
					req.method,
					(req.conn.remoteAddr as any).hostname,
					response.status || 0,
					_, req.url.pathname,
					sizeStr,
					debug ? error.stack : error.message
				);
			});
		};
		
		// logger.debug(
		// 	"%s %s %s",
		// 	req.method,
		// 	(req.conn.remoteAddr as any).hostname,
		// 	req.url.pathname
		// );
		
		// Check if the cache already has a response
		// for this request.
		let cachedResponse = cached.response(req);
		if (cachedResponse)
		{
			await req.respond(cachedResponse);
		}
		else
		{
			try
			{
				const path = await findIndexInDirectory(req.path, indexes);
				if (path)
				{
					req.path = path;
					const ext = extname(path).toLowerCase();
					if (ejs && ext === ".ejs")
					{
						const data = {
							req,
							headers: {
								"Content-Type": fileType("_.html")
							}
						};
						const body = await renderFileToString(path, data);
						await req.respond({
							body,
							status: 200,
							headers: data.headers
						});
					} else if (
						typescript && (
							ext === ".ts" ||
							ext === ".js" ||
							ext === ".tsx" ||
							ext === ".jsx"
						)
					) {
						try
						{
							let _ = await bundle(directory, path);
							_.output = _.output.replaceAll(directory, "/");
							if (_.error) throw new Error(_.output);
							await req.respond({
								body: _.output,
								status: 200,
								headers: {
									"Content-Type": fileType("_.js")
								},
								cache: true
							});
						} catch (error)
						{
							await req.respond({
								body: error.message,
								status: 500
							});
						}
					} else
					{
						const body = await Deno.readTextFile(path);
						await req.respond({
							body,
							status: 200,
							headers: {
								"Content-Type": fileType(path)
							},
							cache: true
						});
					}
				} else if (indexing && await canRead(req.path) && (await Deno.lstat(req.path)).isDirectory)
				{
					await indexDirectory(req);
				}
			} catch (error)
			{
				await req.respond({
					body: debug ? error.stack : error.message,
					status: 500
				});
			}
			if (!hasResponded)
			{
				const htmlPath = resolve(directory, "404.html");
				const ejsPath = resolve(directory, "404.ejs");
				if (await canRead(htmlPath))
				{
					const body = await Deno.readTextFile(htmlPath);
					await req.respond({
						body,
						status: 404,
						headers: {
							"Content-Type": fileType(htmlPath)
						}
					});
				} else if (ejs && await canRead(ejsPath))
				{
					const data = {
						req,
						headers: new Headers()
					};
					data.headers.set("Content-Type", fileType(htmlPath));
					const body = await renderFileToString(ejsPath, data);
					await req.respond({
						body,
						status: 404,
						headers: data.headers
					});
				} else
				{
					await req.respond({
						body: `Cannot get ${req.url.pathname}!`,
						status: 404,
						headers: {
							"Content-Type": fileType(htmlPath)
						}
					});
				}
			}
		}
	}
	
}
