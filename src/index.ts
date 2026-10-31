
import { ownsPath } from "webutils/router";
import { errorPage, reply } from "webutils";

import { routerApi, routerHtml } from "./context";
import "./pages";
import "./apis";

export const X_OPTIONS = {
	// urls
	BASE_URL: "https://commercialsigns.biz/",
	BASE_WWW_URL: "https://www.commercialsigns.biz/",
	S3_BUCKET_URL: "https://s3.commercialsigns.biz/",
	// config
	SESSION_COOKIE_NAME: "session_id",
	SESSION_COOKIE_EXPIRE: 6 * 60 * 60, // 6hrs
	// information
	EMAIL: "info@commercialsigns.biz",
	PHONE1: "785-825-6373",
	PHONE2: "785-825-6367",
	LOCATION: "833 East Crawford St, Salina, KS 67401",
	HOURS_OPEN: "Monday-Friday 9am-5pm",
	HOURS_CLOSED: "Saturday-Sunday",
	DESCRIPTION: "Customize your design online or with us! " +
		"Commercial Signs in Salina, Kansas. " +
		"Screen Printing on t-shirts, hoodies, polos, election signs. " +
		"Vinyl decals for vehicles, banners, aluminum signs, magnets.",
	PHOTO_LOGO: "/images/logo.png",
	PHOTO_FAVICON: "/images/favicon.png",
	PHOTO_FAVICON_APPLE: "/images/favicon-apple.png",
	PHOTO_PRINTING: "/images/printing.png",
	PHOTO_VINYL: "/images/vinyl.png",
	PHOTO_SUPPLIES: "/images/supplies.png",
};

export default {
	async fetch(req, env, ctx) {
		// First router that has a route for this path wins. Unmatched paths go to the
		// HTML router, so they get the HTML 404 page.
		const api = !ownsPath(routerHtml, req) && ownsPath(routerApi, req);
		try {
			return await (api ? routerApi : routerHtml).fetch(req, env, ctx);
		} catch (err) {
			console.error(err);
			if (api) return reply("Internal server error", 500);
			try {
				return errorPage(500, req);
			} catch (err2) {
				console.error(err2);
				return new Response("Internal server error", { status: 500 });
			}
		}
	},
} satisfies ExportedHandler<Env>;
