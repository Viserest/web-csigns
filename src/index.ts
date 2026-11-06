
import { AutoRouter } from "itty-router";

import { router as pagesRouter } from "./pages";
import { router as apisRouter } from "./apis";

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

const router = AutoRouter();
router.all("/*", pagesRouter.fetch);
router.all("/api/v1/*", apisRouter.fetch);

export default {
	...router
} satisfies ExportedHandler<Env>;
