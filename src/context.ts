
import { IRequestStrict, RequestHandler } from "itty-router";
import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import * as d from "drizzle-orm";
import { Uuid, getCookie, reply } from "webutils";
import { createHandlers } from "webutils/handler";

import { X_OPTIONS } from "./index";
import * as schema from "./schema";

/** Cloudflare worker bindings */
export interface Bindings {
	DB: D1Database;
	IMAGES: R2Bucket;
}

/** The arguments every handler receives after the request. */
export type Args = [env: Bindings, ctx: ExecutionContext];

/**
 * Anything that starts with (env, ctx) and may carry extra arguments after
 * them, e.g. [Bindings, ExecutionContext, Logger]. Middlewares are generic
 * over this so they work with whatever extra args your router passes.
 */
export type AnyArgs = [...Args, ...rest: any[]];

export type Db = DrizzleD1Database<typeof schema>;

//
// Request types
//

export type RequestBase = IRequestStrict;
export type RequestDb = RequestBase & {
	db: Db;
}
export type RequestUser = RequestDb & {
	user: schema.User;
}

//
// Handlers
//

export const { handler, op } = createHandlers<RequestBase, Args>({
	getDb: (req, env) => (req as any).db ?? drizzle(env.DB),
});

/** Runs when a middleware rejects. Receives the same arguments as the route. */
export type OnError<A extends AnyArgs = Args> = (
	req: RequestBase,
	...args: A
) => Response | Promise<Response>;

/** Builds a middleware that attaches `req.db`. Never rejects. */
export function setDb<A extends AnyArgs = Args>(): RequestHandler<RequestDb, A> {
	return (req, ...args) => {
		req.db ??= drizzle(args[0].DB);
	};
}

/**
 * Builds a middleware that attaches `req.db` and `req.user`.
 * On any failure it returns `onError(req, ...args)`.
 */
export function setUser<A extends AnyArgs = Args>(
	onError: OnError<A> = () => reply("Unauthorized", 401),
): RequestHandler<RequestUser, A> {
	return async (req, ...args) => {
		req.db ??= drizzle(args[0].DB);

		// Get session id
		const cookie = getCookie(req.headers, X_OPTIONS.SESSION_COOKIE_NAME);
		if (!cookie.ok) return onError(req, ...args);

		// Convert to uuid
		const idSession = Uuid.fromString(cookie.value);
		if (!idSession.ok) return onError(req, ...args);

		// Get user
		const result = await req.db
			.select({ ...d.getTableColumns(schema.users) })
			.from(schema.users)
			.innerJoin(schema.sessions, d.eq(schema.users.id, schema.sessions.userId))
			.where(d.eq(
				schema.sessions.id,
				Buffer.from(idSession.value.toBytes()),
			))
			.limit(1)
			.get();
		if (!result) return onError(req, ...args);

		req.user = result;
	};
}
