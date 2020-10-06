/**
 * Bundle a path.
 * @param path The path to bundle.
 */
export async function bundle (dir: string, path: string): Promise<{ output: string, error: boolean }>
{
	const proc = Deno.run({
		stdout: "piped",
		stderr: "piped",
		cmd: [
			Deno.execPath(),
			"run",
			"--unstable",
			"--allow-net",
			"--allow-read=" + dir,
			import.meta.url,
			path
		]
	});
	if ((await proc.status()).success)
	{
		return {
			output: (await proc.output()).reduce((str, byte) => str += String.fromCharCode(byte), "").trim(),
			error: false
		};
	}
	const output = (await proc.stderrOutput()).reduce((str, byte) => str += String.fromCharCode(byte), "").replace(/\u001b[^m]+m/g, "");
	return {
		output,
		error: true
	};
}

if (import.meta.main)
{
	try
	{
		const [, output ] = await Deno.bundle(Deno.args[0], undefined, {
			lib: [ "esnext", "dom" ],
			jsx: "react"
		});
		console.log(
			`(async ()=>{${output}})();`
				.replace(
					"return r.has(id) ? gExpA(id) : import(mid);",
					"return r.has(id) ? gExpA(id) : await import(mid);"
				).replace(
					"import: (m) => dI(m, id),",
					"import: async (m) => await dI(m, id),"
				)
		);
	} catch (error)
	{
		console.error(error.message);
		Deno.exit(1);
	}
}
