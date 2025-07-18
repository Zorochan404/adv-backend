import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	name: varchar(),
	age: integer(),
	number: integer(),
	email: varchar(),
	password: varchar().default('123456'),
	aadharNumber: varchar("aadhar_number"),
	dlNumber: varchar("dl_number"),
	passportNumber: varchar("passport_number"),
	locality: varchar(),
	city: varchar(),
	state: varchar(),
	country: varchar(),
	pincode: integer(),
	role: varchar().default('user'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});
