
import { html, StatusError } from "itty-router";
import { form, Node, redirect, tag } from "webutils";

import * as schema from "./schema";
import { createSetUser, RequestUser, routerHtml } from "./context";
import { X_OPTIONS } from "./index";
import { checkRole } from "./utils";
import { filesHandler, loginForm, registerForm } from "./apis";

interface Details {
	title?: string;
	url?: string;
}

function Page(details: Details, ...children: Node[]): Response {
	const title = (details.title ? details.title + " | " : "") + "Commercial Signs";
	const url = X_OPTIONS.BASE_URL + details.url;

	return html("<!DOCTYPE html>" + tag("html", { "lang": "en" },
		tag("head", {},
			// page config
			tag("meta", { "charset": "utf-8" }),
			tag("meta", { "name": "viewport", "content": "width=device-width, initial-scale=1" }),
			tag("link", { "rel": "canonical", "href": url }),
			tag("link", {
				"rel": "icon",
				"type": "image/png",
				"sizes": "32x32",
				"href": X_OPTIONS.PHOTO_FAVICON,
			}),
			tag("link", {
				"rel": "apple-touch-icon",
				"sizes": "180x180",
				"href": X_OPTIONS.PHOTO_FAVICON_APPLE,
			}),
			// social sharing
			tag("title", {}, title),
			tag("meta", { "name": "description", "content": X_OPTIONS.DESCRIPTION }),
			tag("meta", { "property": "og:title", "content": title }),
			tag("meta", { "property": "og:description", "content": X_OPTIONS.DESCRIPTION }),
			tag("meta", { "property": "og:url", "content": url }),
			tag("meta", { "property": "og:type", "content": "website" }),
			// stylesheets
			tag("link", { "rel": "stylesheet", "href": "/css/normalize.css" }),
			tag("link", { "rel": "stylesheet", "href": "/css/skeleton.css" }),
			tag("link", { "rel": "stylesheet", "href": "/css/style.css" }),
		),
		tag("body", {},
			tag("div", { "id": "entry" },
				tag("div", { "class": "row" },
					tag("img", {
						"class": "two-thirds offset-by-two column",
						"src": X_OPTIONS.PHOTO_LOGO,
						"alt": "Commercial Signs Logo",
					}),
				),
				tag("div", { "class": "row" },
					tag("div", { "id": "links", "class": "two-thirds offset-by-two column" },
						tag("a", { "href": "/" }, "Home"),
						tag("a", { "href": "/portfolio" }, "Portfolio"),
						tag("a", { "href": "/browse/printing" }, "Screen Printing"),
						tag("a", { "href": "/browse/vinyl" }, "Vinyl Graphics"),
						tag("a", { "href": "/browse/supplies" }, "Graphic Supplies"),
						tag("a", { "href": "/contact" }, "Contact"),
						tag("a", { "href": "/store" }, "Store"),
						tag("a", { "href": "/cart" }, "Cart"),
						tag("a", { "href": "/account/dashboard" }, "Account"),
					),
				),
				tag("hr", {}),
				...children,
				tag("hr", {}),
				tag("div", { "id": "footer" },
					tag("p", {}, "Copyright &copy; " + new Date().getFullYear() + " Commercial Signs, Inc"),
					tag("p", {}, "Site built by Seth Cooper"),
				),
			),
		),
	));
}

routerHtml.get("/", (req, env, ctx) => {
	return Page({},
		tag("div", { "class": "row" },
			tag("div", { "class": "one-half column" },
				tag("h3", {}, "Screen Printing"),
				tag("p", {}, "Customize your design online or by contacting us. Checkout our pre-designed products!"),
				tag("a", { "href": "/store?code=printing", "class": "button button-primary" }, "Store"),
				tag("a", { "href": "/browse/printing", "class": "button" }, "Learn More"),
				tag("a", { "href": "/contact", "class": "button" }, "Contact Us"),
			),
			tag("div", { "class": "one-half column" },
				tag("img", {
					"src": X_OPTIONS.PHOTO_PRINTING,
					"alt": "Image showing screen printing designs",
				}),
			),
		),
		tag("div", { "class": "row" },
			tag("div", { "class": "one-half column" },
				tag("img", {
					"src": X_OPTIONS.PHOTO_VINYL,
					"alt": "Image showing vinyl graphics",
				}),
			),
			tag("div", { "class": "one-half column" },
				tag("h3", {}, "Vinyl Graphics"),
				tag("p", {}, "Customize your design online or by contacting us. Find a decal you like in our pre-designed products!"),
				tag("a", { "href": "/store?code=vinyl", "class": "button button-primary" }, "Store"),
				tag("a", { "href": "/browse/vinyl", "class": "button" }, "Learn More"),
				tag("a", { "href": "/contact", "class": "button" }, "Contact Us"),
			),
		),
		tag("div", { "class": "row" },
			tag("div", { "class": "one-half column" },
				tag("h3", {}, "Graphic Supplies"),
				tag("p", {}, "Checkout our supplies in our online store!"),
				tag("a", { "href": "/store?code=supplies", "class": "button button-primary" }, "Store"),
				tag("a", { "href": "/browse/supplies", "class": "button" }, "Learn More"),
				tag("a", { "href": "/contact", "class": "button" }, "Contact Us"),
			),
			tag("div", { "class": "one-half column" },
				tag("img", {
					"src": X_OPTIONS.PHOTO_SUPPLIES,
					"alt": "Image showing graphic supplies",
				}),
			),
		),
		tag("hr", {}),
		tag("div", { "class": "row" },
			tag("h3", {}, "Store"),
		),
		tag("hr", {}),
		tag("div", { "class": "row" },
			tag("h3", {}, "Contact Us"),
			tag("div", { "class": "four offset-by-one columns" },
				tag("p", {}, X_OPTIONS.LOCATION),
				tag("br", {}),
				tag("p", {}, "Open: " + X_OPTIONS.HOURS_OPEN),
				tag("p", {}, "Closed: " + X_OPTIONS.HOURS_CLOSED),
				tag("br", {}),
				tag("p", {}, "Email: " + X_OPTIONS.EMAIL),
				tag("p", {}, X_OPTIONS.PHONE1),
				tag("p", {}, X_OPTIONS.PHONE2),
			),
			tag("div", { "class": "one-half column" },
				tag("iframe", {
					"src": "https://www.openstreetmap.org/export/embed.html" +
						"?bbox=-97.59875178337099%2C38.82658007210377%2C-97.59606957435608%2C38.82802603806392&amp;amp;layer=mapnik",
					"style": "width: 100%; height: 240px; border: 1px solid black",
				}),
				tag("br", {}),
				tag("small", {},
					tag("a", { "href": "https://www.openstreetmap.org/?#map=19/38.827303/-97.597411" }, "View Larger Map")
				),
			),
		),
	);
});

routerHtml.get("/portfolio", (req, env, ctx) => {
	return Page({
		title: "Portfolio",
		url: "portfolio",
	},
		tag("div", { "id": "photos" }),
	);
});

routerHtml.get("/browse/printing", (req, env, ctx) => {
	return Page({
		title: "Screen Printing",
		url: "browse/printing",
	},
		tag("h2", {}, "Screen", tag("b", {}, "Printing")),
		tag("div", { "class": "row u-text-center" },
			tag("div", { "class": "two-thirds offset-by-two column" },
				tag("p", {}, "Screen printing is an outstanding way to mass produce single " +
					"or multi-color graphics on t-shirts, hoodies, sweatshirts, polos and more!"),
				tag("p", {}, "Choose from many apparel brands such as Comfort Colors, BELLA+CANVAS, Badger, " +
					"Nike, Underarmor, Gildan, Adidas, Puma, and many more."),
				tag("p", {}, "We also screen print on vinyl for car decals, corroplast for election signs, etc."),
				tag("p", {}, "Not all our customers send us jobs ready to be produced. " +
					"We are equipped to create any design that you might need."),
			),
		),
		tag("div", { "class": "row u-text-center" },
			tag("a", { "href": "/store?code=printing", "class": "button button-primary" }, "Store"),
			tag("a", { "href": "/contact", "class": "button" }, "Contact Us"),
		),
	);
});

routerHtml.get("/browse/vinyl", (req, env, ctx) => {
	return Page({
		title: "Vinyl Graphics",
		url: "browse/vinyl",
	},
		tag("h2", {}, "Vinyl", tag("b", {}, "Graphics")),
		tag("div", { "class": "row u-text-center" },
			tag("a", { "href": "/store?code=vinyl", "class": "button button-primary" }, "Store"),
			tag("a", { "href": "/contact", "class": "button" }, "Contact Us"),
		),
	);
});

routerHtml.get("/browse/supplies", (req, env, ctx) => {
	return Page({
		title: "Graphic Supplies",
		url: "browse/supplies",
	},
		tag("h2", {}, "Graphic", tag("b", {}, "Supplies")),
		tag("div", { "class": "row u-text-center" },
			tag("a", { "href": "/store?code=supplies", "class": "button button-primary" }, "Store"),
			tag("a", { "href": "/contact", "class": "button" }, "Contact Us"),
		),
	);
});

routerHtml.get("/contact", (req, env, ctx) => {
	return Page({
		title: "Contact Us",
		url: "contact",
	},
		tag("div", { "class": "row" },
			form({
				href: "/api/v1/contact",
				method: "POST",
				submit_text: "Send",
			},
				tag("div", { "class": "row" },
					tag("div", { "class": "one-third column" },
						tag("h3", {}, "Screen Printing"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aaa" }), " T-Shirts"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aab" }), " Long Sleeve T-Shirts"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aac" }), " Sweatshirts"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aad" }), " Hoodies"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aae" }), " Jackets"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aaf" }), " Shorts"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aag" }), " Sweatpants"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aah" }), " Hats"),
					),
					tag("div", { "class": "one-third column" },
						tag("h3", {}, "Vinyl Graphics"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aai" }), " Corroplast Yard Sign"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aaj" }), " Aluminum Sign"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aak" }), " Vinyl Sticker"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aal" }), " Car Lettering (Not a full wrap)"),
					),
					tag("div", { "class": "one-third column" },
						tag("h3", {}, "Graphic Supplies"),
						tag("label", {}, tag("input", { "type": "checkbox", "name": "aam" }), " Vellum Paper"),
					),
				),
				tag("div", { "class": "row" },
					tag("textarea", {
						"class": "eight offset-by-two columns",
						"style": "height: 200px; resize: none;",
						"placeholder": "Comments",
					}),
				),
				tag("div", { "class": "row" },
					tag("div", { "class": "one-half offset-by-three column" },
						tag("div", { "class": "row" },
							tag("p", {}, "Add an image file (PNG, JPEG, SVG, BMP)"),
							tag("input", { "type": "file", "name": "file", "accept": "image/png, image/jpeg, image/svg, image/bmp" }),
						),
						tag("div", { "class": "row" },
							tag("input", { "class": "one-half column", "type": "text", "name": "name", "placeholder": "Full Name *" }),
							tag("input", { "class": "one-half column", "type": "tel", "name": "phone", "placeholder": "Phone Number *" }),
						),
						tag("div", { "class": "row" },
							tag("input", { "class": "u-full-width", "type": "email", "name": "email", "placeholder": "Email *" }),
						),
						tag("div", { "class": "row" },
							tag("input", { "class": "one-half column", "type": "reset" }),
							tag("input", { "class": "one-half column button-primary", "type": "submit", "value": "Send" }),
						),
					),
				),
			),
		),
	);
});

routerHtml.get("/store", (req, env, ctx) => {
	return Page({
		title: "Store",
		url: "store",
	});
});

routerHtml.get("/cart", (req, env, ctx) => {
	return Page({
		title: "Cart",
		url: "cart",
	});
});

routerHtml.get("/account", (req, env, ctx) => redirect("/account/dashboard"));

routerHtml.get("/account/login", (req, env, ctx) => {
	return Page({ title: "Login" },
		tag("div", { "class": "u-text-center-only" },
			tag("h1", {}, "Login"),
			tag("a", { "href": "/account/register" }, "Register instead?"),
			loginForm.render({ submit_text: "Login" }),
		),
	);
});

routerHtml.get("/account/register", (req, env, ctx) => {
	return Page({ title: "Register" },
		tag("div", { "class": "u-text-center-only" },
			tag("h1", {}, "Register"),
			tag("a", { "href": "/account/login" }, "Login instead?"),
			registerForm.render({ submit_text: "Register" }),
		),
	);
});

routerHtml.get<RequestUser>(
	"/account/dashboard",
	createSetUser(() => redirect("/account/login")),
	(req, env, ctx) => {
		return Page({ title: "Account" },
			tag("h1", {}, "Account Dashboard"),
		);
	}
);

routerHtml.get<RequestUser>(
	"/account/admin",
	createSetUser(() => {
		throw new StatusError(404);
	}),
	(req, env, ctx) => {
		if (checkRole(req.user, schema.Role.Admin)) {
			// Show admin dashboard
			return Page({ title: "Dashboard" },
				tag("h1", {}, "Admin Dashboard"),
				filesHandler.renderAll() as unknown as Node,
			);
		}
		throw new StatusError(404);
	}
);
