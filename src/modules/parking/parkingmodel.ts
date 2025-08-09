import { relations } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  jsonb,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { UserTable } from "../user/usermodel";
import { bookingsTable } from "../booking/bookingmodel";

export const parkingTable = pgTable("parkings", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  locality: varchar("locality"),
  city: varchar("city"),
  state: varchar("state"),
  country: varchar("country"),
  pincode: integer("pincode"),
  capacity: integer("capacity").notNull(),
  mainimg: varchar("mainimg", { length: 255 }).notNull(),
  images: jsonb("images").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations for parking table
export const parkingRelations = relations(parkingTable, ({ many }) => ({
  // Add reverse relations for bookings
  pickupBookings: many(bookingsTable, {
    relationName: "pickupParking",
  }),
  dropoffBookings: many(bookingsTable, {
    relationName: "dropoffParking",
  }),
}));
