"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingTopupRelations = exports.bookingTopupTable = exports.topupRelations = exports.topupTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const usermodel_1 = require("../user/usermodel");
const bookingmodel_1 = require("./bookingmodel");
exports.topupTable = (0, pg_core_1.pgTable)("topups", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Topup details
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(), // e.g., "2 Hour Extension", "1 Day Extension"
    description: (0, pg_core_1.varchar)("description", { length: 500 }),
    duration: (0, pg_core_1.integer)("duration").notNull(), // Duration in hours
    price: (0, pg_core_1.doublePrecision)("price").notNull(),
    // Topup categories
    category: (0, pg_core_1.varchar)("category", { length: 50 }).default("extension"), // extension, emergency, premium
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    // Admin control
    createdBy: (0, pg_core_1.integer)("created_by").references(() => usermodel_1.UserTable.id),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.topupRelations = (0, drizzle_orm_1.relations)(exports.topupTable, ({ one, many }) => ({
    creator: one(usermodel_1.UserTable, {
        fields: [exports.topupTable.createdBy],
        references: [usermodel_1.UserTable.id],
    }),
    bookings: many(bookingmodel_1.bookingsTable),
}));
// Booking topup usage tracking
exports.bookingTopupTable = (0, pg_core_1.pgTable)("booking_topups", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Foreign keys
    bookingId: (0, pg_core_1.integer)("booking_id")
        .notNull()
        .references(() => bookingmodel_1.bookingsTable.id, { onDelete: "cascade" }),
    topupId: (0, pg_core_1.integer)("topup_id")
        .notNull()
        .references(() => exports.topupTable.id, { onDelete: "cascade" }),
    // Usage details
    appliedAt: (0, pg_core_1.timestamp)("applied_at").notNull(),
    originalEndDate: (0, pg_core_1.timestamp)("original_end_date").notNull(),
    newEndDate: (0, pg_core_1.timestamp)("new_end_date").notNull(),
    amount: (0, pg_core_1.doublePrecision)("amount").notNull(),
    // Payment
    paymentStatus: (0, pg_core_1.varchar)("payment_status", { length: 50 }).default("pending"),
    paymentReferenceId: (0, pg_core_1.varchar)("payment_reference_id", { length: 100 }),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.bookingTopupRelations = (0, drizzle_orm_1.relations)(exports.bookingTopupTable, ({ one }) => ({
    booking: one(bookingmodel_1.bookingsTable, {
        fields: [exports.bookingTopupTable.bookingId],
        references: [bookingmodel_1.bookingsTable.id],
    }),
    topup: one(exports.topupTable, {
        fields: [exports.bookingTopupTable.topupId],
        references: [exports.topupTable.id],
    }),
}));
//# sourceMappingURL=topupmodel.js.map