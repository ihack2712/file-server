// Imports
import type {
	Request,
	Response
} from "./types.ts";

/**
 * A cache object to store responses.
 */
export class Cache
{
	
	/** The cached responses. */
	public readonly cached: Map<string, CachedResponse> = new Map();
	
	/**
	 * Initiate a new cache.
	 * @param enabled Whether or not the cache should be enabled.
	 */
	public constructor (public readonly enabled: boolean, public readonly lifetime: number)
	{
		setInterval(() => {
			const n = Date.now();
			for (let [ key, cachedResponse ] of this.cached)
				if (n >= cachedResponse.expires)
					this.cached.delete(key);
		}, 1000);
	}
	
	/**
	 * Save a response for later use.
	 * @param request The request.
	 * @param response The response object to save.
	 */
	public save (request: Request, response: Response): this
	{
		if (!this.enabled) return this;
		this.cached.set(request.url.pathname, {
			expires: Date.now() + this.lifetime,
			response
		});
		return this;
	}
	
	/**
	 * Attempt to find a response for a given request.
	 * @param request The server request.
	 */
	public response (request: Request): Response | void
	{
		const _ = this.cached.get(request.url.pathname);
		if (_) return (this.save(request, _.response), _.response);
	}
	
}

/**
 * A caced response.
 */
type CachedResponse = {
	
	/** The time expiration timestamp for this cached entry */
	expires: number,
	
	/** The cached response object. */
	response: Response
};
