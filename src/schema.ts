
import { sql } from "drizzle-orm";
import * as s from "drizzle-orm/sqlite-core";

/*
 * Only add values to an enum. Never remove
 *
 *
 *
 *
 */

/*
 * File system. Quick query instead of directly to s3 bucket
 */

export const files = s.sqliteTable(
	"files",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),
		userId: s.blob("user_id", { mode: "buffer" })
			.notNull()
			.references(() => users.id, { onDelete: "restrict" }),

		// details
		size: s.int("size").notNull(),
		hash: s.text("hash").notNull(),
		scope: s.text("scope"),

		// timestamps
		createdAt: s.int("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		accessedAt: s.int("accessed_at", { mode: "timestamp" }),
		updatedAt: s.int("updated_at", { mode: "timestamp" }),
		deletedAt: s.int("deleted_at", { mode: "timestamp" }),
	},
	(t) => [
		// indexes
		s.index("files_user_id_idx").on(t.userId),
		s.unique("files_hash_idx").on(t.hash),
		// length check
		s.check("files_id_length", sql`length(${t.id}) = 16`),
		s.check("files_user_id_length", sql`length(${t.userId}) = 16`),
		// insert check
		s.check("files_size_check", sql`${t.size} >= 0`),
		// TODO: validate hash length
	],
);
export type File = typeof files.$inferSelect;

/*
 * User system
 */

export enum Role {
	Guest = 0,
	User = 1,
	Admin = 6340,
}
const roleIds = Object.values(Role).filter(
  (value): value is number => typeof value === "number",
);

export const users = s.sqliteTable(
	"users",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),

		// details
		name: s.text("name")
			.notNull(),
		phone: s.text("phone")
			.notNull(),
		email: s.text("email")
			.notNull(),
		password: s.text("password"),
		role: s.int("role").$type<Role>().notNull(),

		// timestamps
		createdAt: s.int("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		accessedAt: s.int("accessed_at", { mode: "timestamp" }),
		updatedAt: s.int("updated_at", { mode: "timestamp" }),
		deletedAt: s.int("deleted_at", { mode: "timestamp" }),
	},
	(t) => [
		// indexes
		s.uniqueIndex("users_email_unique")
			.on(t.email)
			.where(sql`${t.deletedAt} IS NULL`),
		// length check
		s.check("users_id_length", sql`length(${t.id}) = 16`),
		// insert check
		s.check("users_role_check",
			sql`${t.role} IN (${sql.raw(roleIds.join(", "))})`),
		s.check("users_email_lowercase", sql`${t.email} = lower(${t.email})`),
	]
);
export type User = typeof users.$inferSelect;

export const sessions = s.sqliteTable(
	"sessions",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),
		userId: s.blob("user_id", { mode: "buffer" })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		ipAddress: s.text("ip_addr"),

		// timestamps
		createdAt: s.int("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		expiresAt: s.int("expires_at", { mode: "timestamp" })
			.notNull(),
	},
	(t) => [
		// indexes
		s.index("sessions_user_id_idx").on(t.userId),
		s.index("sessions_expires_at_idx").on(t.expiresAt),
		// length check
		s.check("sessions_id_length", sql`length(${t.id}) = 16`),
		s.check("sessions_user_id_length", sql`length(${t.userId}) = 16`),
	],
);
export type Session = typeof sessions.$inferSelect;

/*
 * Contact
 */

export const contacts = s.sqliteTable(
	"contacts",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),
		userId: s.blob("user_id", { mode: "buffer" })
			.references(() => users.id, { onDelete: "set null" }),
		fileId: s.blob("file_id", { mode: "buffer" })
			.references(() => files.id, { onDelete: "set null" }),
		ipAddress: s.text("ip_addr"),

		// details
		products: s.text("products"),
		comments: s.text("comments"),
		notes: s.text("notes"),

		// timestamps
		createdAt: s.int("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		accessedAt: s.int("accessed_at", { mode: "timestamp" }),
		updatedAt: s.int("updated_at", { mode: "timestamp" }),
		deletedAt: s.int("deleted_at", { mode: "timestamp" }),
	},
	(t) => [
		// length check
		s.check("contacts_id_length", sql`length(${t.id}) = 16`),
		s.check("contacts_user_id_length", sql`length(${t.userId}) = 16`),
		s.check("contacts_file_id_length", sql`length(${t.fileId}) = 16`),
	],
);
export type Contact = typeof contacts.$inferSelect;

/*
 * Order system through store
 */

export const addresses = s.sqliteTable(
	"addresses",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),
		userId: s.blob("user_id", { mode: "buffer" })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),

		// details
		streetNumber: s.text("street_number").notNull(),
		street: s.text("street").notNull(),
		city: s.text("city").notNull(),
		state: s.text("state").notNull(),

		// timestamps
		createdAt: s.int("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		accessedAt: s.int("accessed_at", { mode: "timestamp" }),
		updatedAt: s.int("updated_at", { mode: "timestamp" }),
		deletedAt: s.int("deleted_at", { mode: "timestamp" }),
	},
	(t) => [
		// indexes
		s.index("addresses_user_id_idx").on(t.userId),
		// length check
		s.check("addresses_id_length", sql`length(${t.id}) = 16`),
		s.check("addresses_user_id_length", sql`length(${t.userId}) = 16`),
	],
);
export type Address = typeof addresses.$inferSelect;

export const stores = s.sqliteTable(
	"stores",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),

		// Our store products vs form products
		// If null its our store
		// If text its the code for the form
		code: s.text("code"),

		// details
		name: s.text("name").notNull(),
		description: s.text("description"),
	},
	(t) => [
		// length check
		s.check("stores_id_length", sql`length(${t.id}) = 16`),
		s.check("stores_code_length", sql`length(${t.code}) = 6`),
	],
);
export type Store = typeof stores.$inferSelect;

export enum ProductType {
	Apparel = 0,
	Sign = 1,
	Supplies = 2,
}
const productTypes = Object.values(ProductType).filter(
  (value): value is number => typeof value === "number",
);

export enum ProductSize {
	// Toddler
	Toddler2 = 0,
	Toddler4 = 1,
	Toddler6 = 2,
	// Youth
	YouthXSmall = 10,
	YouthSmall = 11,
	YouthMedium = 12,
	YouthLarge = 13,
	YouthXLarge = 14,
	// Adult
	AdultXSmall = 20,
	AdultSmall = 21,
	AdultMedium = 22,
	AdultLarge = 23,
	AdultXLarge = 24,
	AdultX2Large = 25,
	AdultX3Large = 26,
	AdultX4Large = 27,
	AdultX5Large = 28,
	AdultX6Large = 29,
}
const productSizes = Object.values(ProductSize).filter(
  (value): value is number => typeof value === "number",
);

export const storeItems = s.sqliteTable(
	"store_items",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),
		fileId: s.blob("file_id", { mode: "buffer" })
			.references(() => files.id, { onDelete: "set null" }),
		storeId: s.blob("store_id", { mode: "buffer" })
			.references(() => stores.id, { onDelete: "set null" }),

		// details
		type: s.int("type").$type<ProductType>().notNull(),
		name: s.text("name").notNull(),
		description: s.text("description"),
		price: s.int("price").notNull(),
	},
	(t) => [
		// indexes
		s.index("store_items_file_id_idx").on(t.fileId),
		s.index("store_items_store_id_idx").on(t.storeId),
		// length checks
		s.check("store_items_id_length", sql`length(${t.id}) = 16`),
		s.check("store_items_file_id_length", sql`length(${t.fileId}) = 16`),
		s.check("store_items_store_id_length", sql`length(${t.storeId}) = 16`),
		// insert checks
		s.check("store_items_type_check",
			sql`${t.type} IN (${sql.raw(productTypes.join(", "))})`),
		s.check("store_items_price_check", sql`${t.price} >= 0`),
	],
);
export type StoreItem = typeof storeItems.$inferSelect;

// The status just moves down this list
// If ordertype is pickup, then skip from ready to complete
export enum OrderStatus {
	Placed = 0,
	Shipped = 1,
	Delivered = 2,
	Complete = 3,
}
const orderStatuses = Object.values(OrderStatus).filter(
  (value): value is number => typeof value === "number",
);

export const orders = s.sqliteTable(
	"orders",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),
		userId: s.blob("user_id", { mode: "buffer" })
			.references(() => users.id, { onDelete: "set null" }),
		addressId: s.blob("address_id", { mode: "buffer" })
			.references(() => addresses.id, { onDelete: "set null" }),

		// details
		status: s.int("status").$type<OrderStatus>().notNull(),
		shipping: s.int("shipping").notNull(),
		subtotal: s.int("subtotal").notNull(),
		tax: s.int("tax").notNull(),
		total: s.int("total").notNull(),

		// timestamps
		createdAt: s.int("created_at", { mode: "timestamp" })
			.notNull()
			.default(sql`(unixepoch())`),
		accessedAt: s.int("accessed_at", { mode: "timestamp" }),
		updatedAt: s.int("updated_at", { mode: "timestamp" }),
		deletedAt: s.int("deleted_at", { mode: "timestamp" }),
	},
	(t) => [
		// indexes
		s.index("orders_user_id_idx").on(t.userId),
		// length checks
		s.check("orders_id_length", sql`length(${t.id}) = 16`),
		s.check("orders_user_id_length", sql`length(${t.userId}) = 16`),
		s.check("orders_address_id_length", sql`length(${t.addressId}) = 16`),
		// insert checks
		s.check("orders_status_check",
			sql`${t.status} IN (${sql.raw(orderStatuses.join(", "))})`),
		s.check("orders_amounts_check", sql`${t.shipping} >= 0 AND ${t.subtotal} >= 0 AND ${t.tax} >= 0`),
		s.check("orders_total_check", sql`${t.total} = ${t.shipping} + ${t.subtotal} + ${t.tax}`),
	],
);
export type Order = typeof orders.$inferSelect;

export const orderItems = s.sqliteTable(
	"order_items",
	{
		// ids
		id: s.blob("id", { mode: "buffer" })
			.primaryKey()
			.notNull(),
		orderId: s.blob("order_id", { mode: "buffer" })
			.notNull()
			.references(() => orders.id, { onDelete: "cascade" }),
		storeItemId: s.blob("menu_item_id", { mode: "buffer" })
			.notNull()
			.references(() => storeItems.id, { onDelete: "restrict" }),

		// details
		size: s.int("size").$type<ProductSize>().notNull(),
		quantity: s.int("quantity").notNull(),
		unitPrice: s.int("unit_price").notNull(),
		instructions: s.text("instructions"),
	},
	(t) => [
		// indexes
		s.index("order_items_order_id_idx").on(t.orderId),
		s.index("order_items_store_item_id_idx").on(t.storeItemId),
		// length checks
		s.check("order_items_id_length", sql`length(${t.id}) = 16`),
		s.check("order_items_order_id_length", sql`length(${t.orderId}) = 16`),
		s.check("order_items_store_item_id_length", sql`length(${t.storeItemId}) = 16`),
		// insert checks
		s.check("order_items_size_check",
			sql`${t.size} IN (${sql.raw(productSizes.join(", "))})`),
		s.check("order_items_quantity_check", sql`${t.quantity} > 0`),
		s.check("order_items_unit_price_check", sql`${t.unitPrice} >= 0`),
	],
);
export type OrderItem = typeof orderItems.$inferSelect;
