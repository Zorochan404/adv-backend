"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingRelations = exports.bookingsTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const usermodel_1 = require("../user/usermodel");
const carmodel_1 = require("../car/carmodel");
const parkingmodel_1 = require("../parking/parkingmodel");
exports.bookingsTable = (0, pg_core_1.pgTable)("bookings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Foreign key to users
    userId: (0, pg_core_1.integer)("user_id")
        .notNull()
        .references(() => usermodel_1.UserTable.id, { onDelete: "cascade" }),
    // Foreign key to cars
    carId: (0, pg_core_1.integer)("car_id")
        .notNull()
        .references(() => carmodel_1.carModel.id, { onDelete: "cascade" }),
    // Booking details
    startDate: (0, pg_core_1.timestamp)("start_date").notNull(),
    endDate: (0, pg_core_1.timestamp)("end_date").notNull(),
    pickupDate: (0, pg_core_1.timestamp)("pickup_date"), // Specific pickup date/time
    actualPickupDate: (0, pg_core_1.timestamp)("actual_pickup_date"), // When user actually picked up
    actualDropoffDate: (0, pg_core_1.timestamp)("actual_dropoff_date"), // When user actually returned the car
    // Rescheduling
    originalPickupDate: (0, pg_core_1.timestamp)("original_pickup_date"), // Original pickup date for rescheduling
    rescheduleCount: (0, pg_core_1.integer)("reschedule_count").default(0), // Number of times rescheduled
    maxRescheduleCount: (0, pg_core_1.integer)("max_reschedule_count").default(3), // Maximum allowed reschedules
    // Pricing breakdown
    basePrice: (0, pg_core_1.doublePrecision)("base_price").notNull(),
    advanceAmount: (0, pg_core_1.doublePrecision)("advance_amount").notNull(),
    remainingAmount: (0, pg_core_1.doublePrecision)("remaining_amount").notNull(),
    totalPrice: (0, pg_core_1.doublePrecision)("total_price").notNull(),
    // Extension/Topup
    extensionPrice: (0, pg_core_1.doublePrecision)("extension_price").default(0),
    extensionTill: (0, pg_core_1.timestamp)("extension_till"),
    extensionTime: (0, pg_core_1.integer)("extension_time"), // in hours
    // Late fees
    lateFees: (0, pg_core_1.doublePrecision)("late_fees").default(0), // Late fees for overdue returns
    lateFeesPaid: (0, pg_core_1.boolean)("late_fees_paid").default(false), // Whether late fees have been paid
    lateFeesPaymentReferenceId: (0, pg_core_1.varchar)("late_fees_payment_reference_id", {
        length: 100,
    }), // Payment reference for late fees
    lateFeesPaidAt: (0, pg_core_1.timestamp)("late_fees_paid_at"), // When late fees were paid
    // Car return details
    returnCondition: (0, pg_core_1.varchar)("return_condition", { length: 50 }).default("good"), // good, fair, poor
    returnImages: (0, pg_core_1.varchar)("return_images", { length: 500 }).array().default([]), // Array of return condition image URLs
    returnComments: (0, pg_core_1.varchar)("return_comments", { length: 500 }), // Comments from PIC about return condition
    // Booking status flow
    status: (0, pg_core_1.varchar)("status", { length: 50 }).default("pending"), // pending, advance_paid, confirmed, active, completed, cancelled
    confirmationStatus: (0, pg_core_1.varchar)("confirmation_status", { length: 50 }).default("pending"), // pending, approved, rejected
    // Payment tracking
    advancePaymentStatus: (0, pg_core_1.varchar)("advance_payment_status", {
        length: 50,
    }).default("pending"),
    finalPaymentStatus: (0, pg_core_1.varchar)("final_payment_status", { length: 50 }).default("pending"),
    advancePaymentReferenceId: (0, pg_core_1.varchar)("advance_payment_reference_id", {
        length: 100,
    }),
    finalPaymentReferenceId: (0, pg_core_1.varchar)("final_payment_reference_id", {
        length: 100,
    }),
    // Car condition verification
    carConditionImages: (0, pg_core_1.varchar)("car_condition_images", { length: 500 })
        .array()
        .default([]), // Array of image URLs
    toolImages: (0, pg_core_1.varchar)("tool_images", { length: 500 }).array().default([]), // Array of image URLs
    tools: (0, pg_core_1.jsonb)("tools").default([]), // Array of tool objects with name and imageUrl
    // PIC (Parking In Charge) verification
    picApproved: (0, pg_core_1.boolean)("pic_approved").default(false),
    picApprovedAt: (0, pg_core_1.timestamp)("pic_approved_at"),
    picApprovedBy: (0, pg_core_1.integer)("pic_approved_by").references(() => usermodel_1.UserTable.id),
    picComments: (0, pg_core_1.varchar)("pic_comments", { length: 500 }),
    // OTP Verification System
    otpCode: (0, pg_core_1.varchar)("otp_code", { length: 4 }), // 4-digit OTP
    otpExpiresAt: (0, pg_core_1.timestamp)("otp_expires_at"), // OTP expiration time
    otpVerified: (0, pg_core_1.boolean)("otp_verified").default(false), // Whether OTP was verified
    otpVerifiedAt: (0, pg_core_1.timestamp)("otp_verified_at"), // When OTP was verified
    otpVerifiedBy: (0, pg_core_1.integer)("otp_verified_by").references(() => usermodel_1.UserTable.id), // Who verified the OTP
    // User confirmation
    userConfirmed: (0, pg_core_1.boolean)("user_confirmed").default(false),
    userConfirmedAt: (0, pg_core_1.timestamp)("user_confirmed_at"),
    // Location details
    pickupParkingId: (0, pg_core_1.integer)("pickup_parking_id").references(() => parkingmodel_1.parkingTable.id, { onDelete: "cascade" }),
    dropoffParkingId: (0, pg_core_1.integer)("dropoff_parking_id").references(() => parkingmodel_1.parkingTable.id, { onDelete: "cascade" }),
    // Delivery options
    deliveryType: (0, pg_core_1.varchar)("delivery_type", { length: 50 }).default("pickup"), // pickup, delivery
    deliveryAddress: (0, pg_core_1.varchar)("delivery_address", { length: 500 }),
    deliveryCharges: (0, pg_core_1.doublePrecision)("delivery_charges").default(0),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Define relations for bookings table
exports.bookingRelations = (0, drizzle_orm_1.relations)(exports.bookingsTable, ({ one }) => ({
    user: one(usermodel_1.UserTable, {
        fields: [exports.bookingsTable.userId],
        references: [usermodel_1.UserTable.id],
    }),
    car: one(carmodel_1.carModel, {
        fields: [exports.bookingsTable.carId],
        references: [carmodel_1.carModel.id],
    }),
    pickupParking: one(parkingmodel_1.parkingTable, {
        fields: [exports.bookingsTable.pickupParkingId],
        references: [parkingmodel_1.parkingTable.id],
    }),
    dropoffParking: one(parkingmodel_1.parkingTable, {
        fields: [exports.bookingsTable.dropoffParkingId],
        references: [parkingmodel_1.parkingTable.id],
    }),
    picApprover: one(usermodel_1.UserTable, {
        fields: [exports.bookingsTable.picApprovedBy],
        references: [usermodel_1.UserTable.id],
    }),
}));
//# sourceMappingURL=bookingmodel.js.map