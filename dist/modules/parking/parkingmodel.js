"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parkingRelations = exports.parkingTable = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const bookingmodel_1 = require("../booking/bookingmodel");
exports.parkingTable = (0, pg_core_1.pgTable)("parkings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    locality: (0, pg_core_1.varchar)("locality"),
    city: (0, pg_core_1.varchar)("city"),
    state: (0, pg_core_1.varchar)("state"),
    country: (0, pg_core_1.varchar)("country"),
    pincode: (0, pg_core_1.integer)("pincode"),
    capacity: (0, pg_core_1.integer)("capacity").notNull(),
    mainimg: (0, pg_core_1.varchar)("mainimg", { length: 255 }).notNull(),
    images: (0, pg_core_1.jsonb)("images").notNull(),
    lat: (0, pg_core_1.doublePrecision)("lat").notNull(),
    lng: (0, pg_core_1.doublePrecision)("lng").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Define relations for parking table
exports.parkingRelations = (0, drizzle_orm_1.relations)(exports.parkingTable, ({ many }) => ({
    // Add reverse relations for bookings
    pickupBookings: many(bookingmodel_1.bookingsTable, {
        relationName: "pickupParking",
    }),
    dropoffBookings: many(bookingmodel_1.bookingsTable, {
        relationName: "dropoffParking",
    }),
}));
//# sourceMappingURL=parkingmodel.js.map