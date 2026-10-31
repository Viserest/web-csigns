
# Commercial Signs' Website

https://commercialsigns.biz

Commercial Signs' website using:
- Cloudflare Workers
	- https://developers.cloudflare.com/workers/
- R2 Buckets
	- https://developers.cloudflare.com/r2/
- D1 Database
	- https://developers.cloudflare.com/d1/

## Ordering

### Payment

Using Stripe Payments with Link
- https://docs.stripe.com/payments/link

### Stores

```
// Store has a list of Store Products
Store -> Vec<StoreProduct>
// Store's Product is converted into an Order's Product on adding to Cart
StoreProduct -> OrderProduct
// Order has a list of Order Products
Order -> Vec<OrderProduct>
// Order also points to a User
Order -> User
```

### Products

Creating a product:
```
apparel
	material
		shirts
		hoodies
		pants/shorts
		towels
		hats
		...
	design [front, back, left sleeve, right sleeve]
		"type"
			screen print
			vinyl
	DIVERGE:material color
	DIVERGE:design colors [1..6]
	ORDER:size
	ORDER:quantity
decals
	material
		none (just the vinyl)
		aluminum
		coroplast
		...
	design [front, back]
		"type"
			screen print
			vinyl
	DIVERGE:material color
	DIVERGE:design colors [1..6]
	ORDER:size
	ORDER:quantity
supplies
	ORDER:size
	ORDER:quantity
```

## Webpages

| Page              | Link                 |
| ----------------- | -------------------- |
| Home              | `/`                  |
| Portfolio         | `/portfolio`         |
| Printing          | `/browse/printing`   |
| Vinyl             | `/browse/vinyl`      |
| Graphic Supplies  | `/browse/supplies`   |
| Contact           | `/contact`           |
| Store             | `/store`             |
| Cart              | `/cart`              |
| Account register  | `/account/register`  |
| Account login     | `/account/login`     |
| Account dashboard | `/account/dashboard` |
| Account admin     | `/account/admin`     |

### Apis

#### Version 1

|                 | Method | Link                             | Params |
| --------------- | ------ | -------------------------------- | ------ |
| *Files*         | LCRD   | `/api/v1/files`                  | |
| *Users*         | LRUD   | `/api/v1/users`                  | |
|                 | C:POST | `/api/v1/users/register`         | { name: string, email: string, password: string } |
| *Sessions*      | LRD    | `/api/v1/sessions`               | |
|                 | C:POST | `/api/v1/users/login`            | { email: string, password: string } |

## Running

```
npm run dev               Run locally
npm run start             Run locally
npm run deploy            Deploy to Cloudflare
npm run test              Run tests
npm run cf-typegen        Regenerate worker types
npx drizzle-kit generate  Regenerate sql migrations
```

## Project Tree

```
src/          Website typescript code
  index.ts    Configurations as X_OPTIONS
  context.ts  Types, variables, and created routers
  pages.ts    All pages, public and private
  apis.ts     All apis, public and private
tests/*       Website tests before publishing
static/*      Static content like css and javascript
migrations/*  Sql statements for Cloudflare D1 Database
```
