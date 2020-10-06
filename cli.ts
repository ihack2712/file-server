// Imports
import { ms } from "https://deno.land/x/ms@v0.1.0/ms.ts";
import { Command } from "https://deno.land/x/cliffy@v0.14.2/command/mod.ts";
import { grantOrThrow } from "https://deno.land/std@0.73.0/permissions/mod.ts";
import { resolve } from "https://deno.land/std@0.73.0/path/mod.ts";
import { server } from "./mod.ts";

const _ = await new Command()
	.name("file-server")
	.description("An on the go file-server.")
	.option("-d, --debug", "Show debug information.")
	.option("-p, --port <port:number>", "The port to run the file server on.")
	.option("-H, --host <host:string>", "The host to run the file server on.")
	.option("-c, --cert <file:string>", "TLS certificate file (enables TLS).")
	.option("-k, --key <file:string>", "TLS key file (enables TLS).")
	.option("-i, --index <name:string>", "An index file, if entering a directory.", { collect: true })
	.option("-L, --lifetime <time:string>", "The cache lifetime (default 30m).")
	.option("--cache", "Cache resources.")
	.option("-e, --ejs", "Enable Embedded-JavaScript")
	.option("-t, --typescript", "Use Deno's bundler to parse typescript files.")
	.option("-C, --cors", "Enable CORS via the \"Access-Control-Allow-Origin\" header.")
	.option("-N, --no-indexing", "Disable directory listing.")
	.option("-n, --no-color", "Disable colors in logs.")
	.option("-l, --no-logging", "Disable logging.")
	.arguments("[directory]")
	.action(async (
		{
			port,
			host,
			noColor,
			cert,
			key,
			cors,
			index,
			noIndexing,
			noLogging,
			ejs,
			debug,
			cache,
			typescript,
			lifetime
		}: {
			port?: number,
			host?: string,
			noColor?: boolean,
			cert?: string,
			key?: string,
			cors?: boolean,
			index?: string[],
			noIndexing?: boolean,
			noLogging?: boolean,
			ejs?: boolean,
			debug?: boolean,
			cache?: boolean,
			typescript?: boolean,
			lifetime?: string
		},
		directory?: string
	) => {
		
		if (!directory)
		{
			await grantOrThrow({ name: "read", path: "." });
			directory = Deno.cwd();
		} else
		{
			await Deno.permissions.revoke({ name: "read", path: "." });
			await grantOrThrow({ name: "read", path: directory });
			directory = resolve(Deno.cwd(), directory);
			await Deno.permissions.revoke({ name: "read", path: "." });
			await grantOrThrow({ name: "read", path: directory! });
		}
		
		const PORT = port ?? 0;
		const HOST = host ?? "127.0.0.1";
		const colors = noColor !== true;
		const enableCors = cors === true;
		const enableIndexing = noIndexing !== true;
		const enableLogging = noLogging !== true;
		const enableEJS = ejs === true;
		const enableTS = typescript === true;
		const CERT = cert ?? "";
		const KEY = key ?? "";
		const indexes = [ ...(enableEJS ? [ "index.ejs" ] : []), "index.html", ...(index ?? [ ]) ];
		const debugging = debug === true;
		const caching = cache === true;
		const lms = ((_: number = 30_000_000) => {
			if (lifetime && /^([0-9]+|0x[0-9a-z]+|0o[0-7]+|0b[01]+)$/gi.test(lifetime))
				return Number(lifetime) * 1000;
			if (lifetime) return ms(lifetime) as number || _;
			return _;
		})();
		
		if (CERT || KEY)
		{
			if (CERT === "" || KEY === "")
				throw new Error("Both cert and key must be defined to use TLS!");
			await grantOrThrow(
				{ name: "read", path: CERT },
				{ name: "read", path: KEY }
			);
		}
		
		await grantOrThrow({ name: "net" });
		
		await server({
			directory,
			port: PORT, host: HOST,
			cert: CERT, key: KEY,
			cache: caching, lifetime: lms, cors: enableCors, indexing: enableIndexing, indexes,
			ejs: enableEJS, typescript: enableTS,
			logging: enableLogging, debug: debugging, colors
		}).catch(console.error);
	})
	.parse();
