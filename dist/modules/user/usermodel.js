"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vendorRelations = exports.UserTable = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const parkingmodel_1 = require("../parking/parkingmodel");
const bookingmodel_1 = require("../booking/bookingmodel");
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", [
    "user",
    "admin",
    "vendor",
    "parkingincharge",
]);
exports.UserTable = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name"),
    avatar: (0, pg_core_1.varchar)("avatar"),
    age: (0, pg_core_1.integer)("age"),
    number: (0, pg_core_1.bigint)("number", { mode: "number" }),
    email: (0, pg_core_1.varchar)("email"),
    password: (0, pg_core_1.varchar)("password").default("123456"),
    aadharNumber: (0, pg_core_1.varchar)("aadhar_number"),
    aadharimg: (0, pg_core_1.varchar)("aadhar_img"),
    dlNumber: (0, pg_core_1.varchar)("dl_number"),
    dlimg: (0, pg_core_1.varchar)("dl_img"),
    passportNumber: (0, pg_core_1.varchar)("passport_number"),
    passportimg: (0, pg_core_1.varchar)("passport_img"),
    lat: (0, pg_core_1.doublePrecision)("lat"),
    lng: (0, pg_core_1.doublePrecision)("lng"),
    locality: (0, pg_core_1.varchar)("locality"),
    city: (0, pg_core_1.varchar)("city"),
    state: (0, pg_core_1.varchar)("state"),
    country: (0, pg_core_1.varchar)("country"),
    pincode: (0, pg_core_1.integer)("pincode"),
    role: (0, exports.userRoleEnum)("role").default("user"),
    isverified: (0, pg_core_1.boolean)("is_verified").default(false),
    parkingid: (0, pg_core_1.integer)("parkingid").references(() => parkingmodel_1.parkingTable.id, {
        onDelete: "cascade",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Note: The relation to cars is defined in the car model to avoid circular imports
exports.vendorRelations = (0, drizzle_orm_1.relations)(exports.UserTable, ({ one, many }) => ({
    parking: one(parkingmodel_1.parkingTable, {
        fields: [exports.UserTable.parkingid],
        references: [parkingmodel_1.parkingTable.id],
    }),
    // Add reverse relation for bookings
    bookings: many(bookingmodel_1.bookingsTable),
}));
//# sourceMappingURL=usermodel.js.map