/**
 * Bundle a path.
 * @param path The path to bundle.
 */
export async function bundle (dir: string, path: string): Promise<string>
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
	const status = (await proc.status()).success;
	if (status)
	{
		return (await proc.output()).reduce((str, byte) => str += String.fromCharCode(byte), "").trim();
	}
	const message = (await proc.stderrOutput()).reduce((str, byte) => str += String.fromCharCode(byte), "");
	throw new Error(message.trim());
}

if (import.meta.main)
{
	try
	{
		const [, output ] = await Deno.bundle(Deno.args[0]);
		console.log(output);
	} catch (error)
	{
		console.log(error.message);
	}
}
