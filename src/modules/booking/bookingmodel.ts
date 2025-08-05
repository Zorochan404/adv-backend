import {
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  timestamp,
  varchar,
  boolean,
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

  // Pricing breakdown
  basePrice: doublePrecision("base_price").notNull(),
  advanceAmount: doublePrecision("advance_amount").notNull(),
  remainingAmount: doublePrecision("remaining_amount").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),

  // Extension/Topup
  extensionPrice: doublePrecision("extension_price").default(0),
  extensionTill: timestamp("extension_till"),
  extensionTime: integer("extension_time"), // in hours

  // Booking status flow
  status: varchar("status", { length: 50 }).default("pending"), // pending, advance_paid, confirmed, active, completed, cancelled
  confirmationStatus: varchar("confirmation_status", { length: 50 }).default(
    "pending"
  ), // pending, approved, rejected

  // Payment tracking
  advancePaymentStatus: varchar("advance_payment_status", {
    length: 50,
  }).default("pending"),
  finalPaymentStatus: varchar("final_payment_status", { length: 50 }).default(
    "pending"
  ),
  advancePaymentReferenceId: varchar("advance_payment_reference_id", {
    length: 100,
  }),
  finalPaymentReferenceId: varchar("final_payment_reference_id", {
    length: 100,
  }),

  // Car condition verification
  carConditionImages: varchar("car_condition_images", { length: 500 })
    .array()
    .default([]), // Array of image URLs
  toolImages: varchar("tool_images", { length: 500 }).array().default([]), // Array of image URLs
  tools: varchar("tools", { length: 500 }).array().default([]), // Array of tool names

  // PIC (Parking In Charge) verification
  picApproved: boolean("pic_approved").default(false),
  picApprovedAt: timestamp("pic_approved_at"),
  picApprovedBy: integer("pic_approved_by").references(() => UserTable.id),
  picComments: varchar("pic_comments", { length: 500 }),

  // User confirmation
  userConfirmed: boolean("user_confirmed").default(false),
  userConfirmedAt: timestamp("user_confirmed_at"),

  // Location details
  pickupParkingId: integer("pickup_parking_id").references(
    () => parkingTable.id,
    { onDelete: "cascade" }
  ),
  dropoffParkingId: integer("dropoff_parking_id").references(
    () => parkingTable.id,
    { onDelete: "cascade" }
  ),

  // Delivery options
  deliveryType: varchar("delivery_type", { length: 50 }).default("pickup"), // pickup, delivery
  deliveryAddress: varchar("delivery_address", { length: 500 }),
  deliveryCharges: doublePrecision("delivery_charges").default(0),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  picApprover: one(UserTable, {
    fields: [bookingsTable.picApprovedBy],
    references: [UserTable.id],
  }),
}));
