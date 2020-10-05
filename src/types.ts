// Imports
import type {
	Response as ServerResponse,
	ServerRequest
} from "./deps.ts";

/**
 * A much kinder response than the Response.
 */
export type KindResponse = Omit<
	ServerResponse,
	| "headers"
> & {
	headers?: {
		[key: string]: string;
	} | Headers;
	cache?: boolean;
};

/**
 * The response object.
 */
export type Response = ServerResponse & {
	
	/** The headers to send back in the response. */
	headers: Headers,
	
	/** Whether or not this response should be cached. */
	cache: boolean
};

/**
 * The request object.
 */
export type Request = Omit<
	ServerRequest,
	| "url"
	| "respond"
> & {
	
	/** The url. */
	url: URL;
	
	/** The path that the URL is pointing to. */
	path: string;
	
	/** The original respond function. */
	__respond__: ServerRequest["respond"];
	
	/**
	 * Respond to the request.
	 * @param response The response object.
	 */
	respond: (response: KindResponse) => Promise<void>;
	
};
