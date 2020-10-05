// Imports
import { sprintf } from "./deps.ts";
import {
	blue,
	gray,
	red,
	yellow,
	
} from "https://deno.land/std@0.73.0/fmt/colors.ts";

/**
 * A logging utility.
 */
export class Logger
{
	
	public readonly colors: boolean;
	public readonly _debug: boolean;
	public readonly _output: boolean;
	
	/**
	 * Initiate a new logger.
	 * @param options The logger options.
	 */
	public constructor ({ colors, debug, output }: { colors?: boolean, debug?: boolean, output?: boolean })
	{
		this.colors = colors ?? true;
		this._debug = debug ?? false;
		this._output = output !== false;
	}
	
	/**
	 * Output a message to the console.
	 * @param message The message.
	 * @param args Any arguments that should be used in the message.
	 */
	private _ (type: string, color: (s: string) => string, message: any, ...args: any[])
	{
		if (!this._output) return this;
		const t = this.colors ? color(type) : type;
		const date = new Date();
		if (typeof message === "string")
		{
			console.log(date, t, sprintf(message, ...args));
		} else
		{
			console.log(date, t, message, ...args);
		}
		return this;
	}
	
	public debug (message: any, ...args: any)
	{
		return this._debug ? this._("DEBUG", gray, message, ...args) : this;
	}
	
	public info (message: any, ...args: any)
	{
		return this._(" INFO", blue, message, ...args);
	}
	
	public warn (message: any, ...args: any)
	{
		return this._(" WARN", yellow, message, ...args);
	}
	
	public error (message: any, ...args: any)
	{
		return this._("ERROR", red, message, ...args);
	}
	
}
