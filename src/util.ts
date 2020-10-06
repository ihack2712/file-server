// Imports
import {
	contentType,
	extname,
	exists
} from "./deps.ts";

/**
 * Get the content type of a file.
 * @param path Path to the file.
 */
export function fileType (path: string): string
{
	return contentType(extname(path)) || "text/plain; charset=utf-8";
}

/**
 * Check whether or not Deno has access to read a
 * certain file/directory.
 * @param path The path to the file or directory.
 */
export async function denoCanRead (path: string): Promise<boolean>
{
	const q = await Deno.permissions.query({ name: "read", path });
	return q.state === "granted";
}

/**
 * Check whether or not the application can read
 * a certain file or directory.
 * @param path The path to check read permissions for.
 */
export async function canRead (path: string): Promise<boolean>
{
	return (
		(await denoCanRead(path)) &&
		(await exists(path)) &&
		((((await Deno.lstat(path)).mode ?? 0) & 292) === 292)
	);
}

/**
 * Turn a number into a readable number.
 * @param n The number.
 */
export function readableNumber (n: number, f: number = 2): string
{
	const [ decimal, float ] = n.toFixed(f).split(".");
	const decimals = decimal.split(/(.{1,3})$/g).reduce((prev: string[], c: string) => (c === "" ? undefined: prev.push(c), prev), [ ]);
	return decimals.join(",") + (float ? "." + float : "");
}

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;
const TB = GB * 1024;
const PB = TB * 1024;

const units: string[] = [
	"bytes",
	"kb",
	"mb",
	"gb",
	"tb"
];

/**
 * Turn bytes into a readable string.
 * @param bytes The bytes.
 */
export function toReadableSize (bytes: number): string
{
	for (let i = units.length; i > 0; i--)
	{
		const unitSize = i > 1 ? 1024 ** (i - 1) : i;
		const size = bytes / unitSize;
		if (size < 1 && i > 1) continue;
		return readableNumber(size, i > 1 ? 2 : 0) + " " + units[i - 1];
	}
	return readableNumber(bytes, 0) + " " + units[0];
}
