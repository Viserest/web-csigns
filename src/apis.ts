
import * as d from "drizzle-orm";
import { Uuid, defineForm, hashPassword, isAsciiOrSpace, isEmail, reply, verifyPassword } from "webutils";

import { adminOnly, checkRole } from "./utils";
import * as schema from "./schema";
import { handler, RequestDb, routerApi, setDb, setUser } from "./context";
import { X_OPTIONS } from "./index";

/*
 * File system. Quick query instead of directly to r2 bucket
 */

// Files
export const filesHandler = handler(routerApi, "/api/v1/files", {
	table: schema.files,
	list: {
		before: [setUser, adminOnly],
		message: "Found files",
	},
	create: {
		before: [setUser, adminOnly],
		handler: async (req, env, ctx) => {
			if (!checkRole(req.user, schema.Role.Admin)) {
				return reply("Unauthorized", 403);
			}

			// Content type
			const contentTypeHeader = req.headers.get("content-type");
			const contentType = contentTypeHeader?.split(";", 1)[0].trim().toLowerCase();

			if (!contentType || !/^image\/[a-z0-9.+-]+$/.test(contentType)) {
				return reply("Content-Type must be an image MIME type", 415);
			}

			// Content length
			const lengthHeader = req.headers.get("content-length");
			if (!lengthHeader || !/^\d+$/.test(lengthHeader)) {
				return reply("A valid Content-Length header is required", 400);
			}

			const expectedSize = Number(lengthHeader);
			const maxSize = 4 * 1024 * 1024;

			if (!Number.isSafeInteger(expectedSize)) {
				return reply("Invalid Content-Length", 400);
			}
			if (expectedSize === 0) {
				return reply("File must not be empty", 400);
			}
			if (expectedSize >= maxSize) {
				return reply("File must be less than 4 MB", 413);
			}
			if (!req.body) {
				return reply("Request body is required", 400);
			}

			// Read with a limit so a body larger than the declared size can't consume
			// unbounded memory.
			const reader = req.body.getReader();
			const chunks: Uint8Array[] = [];
			let size = 0;

			try {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					if (!value) continue;

					size += value.byteLength;
					if (size >= maxSize) {
						await reader.cancel();
						return reply("File must be less than 4 MB", 413);
					}
					if (size > expectedSize) {
						await reader.cancel();
						return reply("Content-Length does not match the request body", 400);
					}

					chunks.push(value);
				}
			} finally {
				reader.releaseLock();
			}

			if (size === 0) {
				return reply("File must not be empty", 400);
			}
			if (size !== expectedSize) {
				return reply("Content-Length does not match the request body", 400);
			}

			const bytes = new Uint8Array(size);
			let offset = 0;
			for (const chunk of chunks) {
				bytes.set(chunk, offset);
				offset += chunk.byteLength;
			}

			// hash
			const digest = await crypto.subtle.digest("SHA-256", bytes);
			const hash = Array.from(new Uint8Array(digest), byte =>
				byte.toString(16).padStart(2, "0"),
			).join("");

			// scope, can be null
			const scope = Array.isArray(req.query["scope"])
				? req.query["scope"].join(" ")
				: req.query["scope"];

			// add to r2 bucket
			const id = Uuid.randomv4();
			await env.IMAGES.put(id.toString(), bytes, {
				httpMetadata: { contentType },
			});

			// add to d1 table
			const result = await req.db
				.insert(schema.files)
				.values({
					id: id.toBytes(),
					userId: Uuid.fromBytes(req.user.id).toBytes(),
					size,
					hash,
					scope,
				})
				.run();
			if (!result.success) return reply("Error uploading file", 500);

			return reply("Uploaded file", 201);
		},
	},
	read: {
		before: [setUser, adminOnly],
		message: "Found file",
	},
	update: null,
	delete: {
		before: [setUser, adminOnly],
		handler: async (req, env, ctx) => {
			if (!checkRole(req.user, schema.Role.Admin)) {
				return reply("Unauthorized", 403);
			}

			let id;
			try {
				id = Uuid.fromString(req.params["id"]);
			} catch {
				return reply("Invalid required param, id", 400);
			}

			// delete from r2
			await env.IMAGES.delete(id.toString());

			// delete from d1
			const result = await req.db
				.delete(schema.files)
				.where(d.eq(
					schema.files.id,
					Buffer.from(id.toBytes()),
				))
				.run();
			if (!result.success) return reply("Error deleting file", 500);

			return reply("Deleted file", 200);
		},
	},
});

/*
 * User system
 */

// Users
handler(routerApi, "/api/v1/users", {
	table: schema.users,
	list: {
		before: [setUser, adminOnly],
		message: "Found users",
	},
	// register is an alias of create
	create: null,
	read: {
		before: [setUser, adminOnly],
		message: "Found user",
	},
	update: {
		before: [setUser, adminOnly],
		fields: ["name", "email", "role"],
		message: "Updated user",
	},
	delete: {
		before: [setUser, adminOnly],
		soft: true,
		message: "Deleted user",
	},
});
// create
export const registerForm = defineForm({
	href: "/api/v1/users/register",
	method: "POST",
	fields: {
		name: { type: "text", placeholder: "John Smith" },
		phone: { type: "text", placeholder: "123-456-7890" },
		email: { type: "email", placeholder: "john@smith.com" },
		password: { type: "password", placeholder: "Password" },
	},
});
routerApi.post<RequestDb>(registerForm.href, setDb, async (req, env, ctx) => {
	const result = await registerForm.parseRequest(req);
	if (!result.ok) return reply(result.error, 400);

	const { name, phone, email, password } = result.value;

	const normalizedPhone = phone.trim();

	const normalizedEmail = email.trim().toLowerCase();
	if (!isEmail(normalizedEmail)) {
		return reply("Invalid email", 400);
	}

	// Bound hashing work and avoid silently truncating passwords.
	if (new TextEncoder().encode(password).byteLength > 1024) {
		return reply("Password is too long", 400);
	}

	const passwordHash = await hashPassword(password);

	// Requires a UNIQUE constraint/index on users.email.
	const inserted = await req.db
		.insert(schema.users)
		.values({
			id: Buffer.from(Uuid.randomv4().toBytes()),
			name: name.trim(),
			phone: normalizedPhone,
			email: normalizedEmail,
			password: passwordHash,
			role: schema.Role.User,
		})
		.onConflictDoNothing()
		.returning({ id: schema.users.id })
		.get();
	if (!inserted) return reply("Email is already registered", 409);

	return reply("Registered", 201, {
		location: "/account/login",
	});
});

// Sessions
handler(routerApi, "/api/v1/sessions", {
	table: schema.sessions,
	list: {
		before: [setUser, adminOnly],
		message: "Found sessions",
	},
	// login is an alias of create
	create: null,
	read: {
		before: [setUser, adminOnly],
		message: "Found session",
	},
	update: null,
	delete: {
		before: [setUser, adminOnly],
		soft: false,
		message: "Deleted session",
	},
});
// create
export const loginForm = defineForm({
	href: "/api/v1/users/login",
	method: "POST",
	fields: {
		email: { type: "email", placeholder: "john@smith.com" },
		password: { type: "password", placeholder: "Password" },
	},
});
routerApi.post<RequestDb>(loginForm.href, setDb, async (req, env, ctx) => {
	const result2 = await loginForm.parseRequest(req);
	if (!result2.ok) return reply(result2.error, 400);

	const { email, password } = result2.value;

	const normalizedEmail = email.trim().toLowerCase();
	if (!isEmail(normalizedEmail)) {
		return reply("Invalid email", 400);
	}

	// Bound hashing work and avoid silently truncating passwords.
	if (new TextEncoder().encode(password).byteLength > 1024) {
		return reply("Password is too long", 400);
	}

	// get user
	const user = await req.db
		.select({ ...d.getTableColumns(schema.users) })
		.from(schema.users)
		.where(d.and(
			d.eq(schema.users.email, normalizedEmail),
			d.isNull(schema.users.deletedAt),
		))
		.limit(1)
		.get();
	if (!user) return reply("Invalid email or password", 401);

	const DUMMY_HASH = await hashPassword("dummy-password-for-timing");

	const result = await verifyPassword(password, user?.password ?? DUMMY_HASH);
	if (!user?.password || !result) return reply("Invalid email or password", 401);

	// create session
	const session = await req.db
		.insert(schema.sessions)
		.values({
			id: Buffer.from(Uuid.randomv4().toBytes()),
			userId: user.id,
			expiresAt: new Date(Date.now() + X_OPTIONS.SESSION_COOKIE_EXPIRE * 1000),
		})
		.returning()
		.get();

	const res = reply("Logging in...", 200, {
		location: "/account/dashboard",
	});
	res.headers.append("Set-Cookie",
		X_OPTIONS.SESSION_COOKIE_NAME + "=" +
		Uuid.fromBytes(session.id).toString() +
		"; Path=/; HttpOnly; Secure; SameSite=Lax");
	return res;
});
