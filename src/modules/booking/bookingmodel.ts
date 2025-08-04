import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { UserTable } from "../user/usermodel";
import { carModel } from "../car/carmodel";
import { parkingTable } from "../parking/parkingmodel";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),

  // Foreign key to users
  userId: integer("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),

  // Foreign key to cars
  carId: integer("car_id")
    .notNull()
    .references(() => carModel.id, { onDelete: "cascade" }),

  // Booking details
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  price: doublePrecision("price"),
  insurancePrice: doublePrecision("insurance_price").default(0),
  totalPrice: doublePrecision("total_price"),
  extensionPrice: doublePrecision("extension_price"),
  extentiontill: timestamp("extention_till"),
  extentiontime: integer("extention_time"),
  status: varchar("status", { length: 50 }).default("pending"),
  tool: varchar("tool", { length: 500 }).array().default([]),
  tripStartingCarImages: jsonb("trip_starting_car_images"),
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"),
  paymentReferenceId: varchar("payment_reference_id", { length: 50 }),
  pickupParkingId: integer("pickup_parking_id").references(
    () => parkingTable.id,
    { onDelete: "cascade" }
  ),
  dropoffParkingId: integer("dropoff_parking_id").references(
    () => parkingTable.id,
    { onDelete: "cascade" }
  ),

  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations for bookings table
export const bookingRelations = relations(bookingsTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [bookingsTable.userId],
    references: [UserTable.id],
  }),
  car: one(carModel, {
    fields: [bookingsTable.carId],
    references: [carModel.id],
  }),
  pickupParking: one(parkingTable, {
    fields: [bookingsTable.pickupParkingId],
    references: [parkingTable.id],
  }),
  dropoffParking: one(parkingTable, {
    fields: [bookingsTable.dropoffParkingId],
    references: [parkingTable.id],
  }),
}));
