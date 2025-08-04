import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { reviewModel } from "../review/reviewmodel";
import { UserTable } from "../user/usermodel";
import { parkingTable } from "../parking/parkingmodel";
import { bookingsTable } from "../booking/bookingmodel";

export const carModel = pgTable("car", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  maker: varchar("maker", { length: 255 }).notNull(),
  year: integer("year").notNull(),
  carnumber: varchar("carnumber", { length: 255 }).notNull(),
  price: integer("price").notNull(),
  discountedprice: integer("discountedprice").notNull().default(0),
  color: varchar("color", { length: 255 }).notNull(),
  transmission: varchar("transmission", { length: 255 }).notNull(),
  fuel: varchar("fuel", { length: 255 }).notNull(),
  type: varchar("type", { length: 255 }).notNull(),
  seats: integer("seats").notNull(),
  rcnumber: varchar("rcnumber", { length: 255 }),
  rcimg: varchar("rcimg", { length: 255 }),
  pollutionimg: varchar("pollutionimg", { length: 255 }),
  insuranceimg: varchar("insuranceimg", { length: 255 }),
  inmaintainance: boolean("inmaintainance").notNull().default(false),
  isavailable: boolean("isavailable").notNull().default(true),
  images: jsonb("images"),
  mainimg: varchar("mainimg", { length: 255 }).notNull(),
  vendorid: integer("vendorid")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  parkingid: integer("parkingid").references(() => parkingTable.id),
  isapproved: boolean("isapproved").notNull().default(false),
  ispopular: boolean("ispopular").notNull().default(false),
  insurancePrice: integer("insuranceprice").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const carRelations = relations(carModel, ({ one, many }) => ({
  vendor: one(UserTable, {
    fields: [carModel.vendorid],
    references: [UserTable.id],
  }),
  parking: one(parkingTable, {
    fields: [carModel.parkingid],
    references: [parkingTable.id],
  }),
  // Add reverse relation for bookings
  bookings: many(bookingsTable),
  // Add reverse relation for reviews
  reviews: many(reviewModel),
}));
