// Imports
import type { Response } from "https://deno.land/std@0.73.0/http/server.ts";

export type PluginDesc = {
	readonly name: string,
	readonly aliases?: string[],
	readonly description: string,
	readonly author: string,
	readonly canHandle: (path: string) => boolean | Promise<boolean>,
	readonly handle: (path: string) => Response | Promise<Response>,
};

const registry = new Map<string, PluginDesc>();
const plugins: PluginDesc[] = [ ];

export function validateName (name: string)
{
	if (name.length < 1)
		throw new Error("Plugin name must be longer than 1 character!");
	if (name.length > 32)
		throw new Error("Plugin name must be 32 characters or shorter!");
	if (!/^[0-9a-z\-\_]+$/g.test(name))
		throw new Error("Plugin name can only contain characters '0-9', 'a-z', '-' and '_'!");
	if (registry.has(name))
		throw new Error("Plugin name is already in use!");
}

export function registerPlugin (plugin: PluginDesc)
{
	validateName(plugin.name);
	for (let alias of (plugin.aliases || [ ]))
		validateName(alias);
	registry.set(plugin.name, plugin);
	for (let alias of (plugin.aliases || [ ]))
		registry.set(alias, plugin);
}

export function getPluginNames ()
{
	return plugins.map(plugin => plugin.name);
}

export function getPlugin (name: string): PluginDesc
{
	if (!registry.has(name))
		throw new Error(`Plugin '${name}' not found!`);
	return registry.get(name)!;
}
