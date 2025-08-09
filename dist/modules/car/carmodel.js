"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carCatalogRelations = exports.carRelations = exports.carModel = exports.carCatalogTable = exports.fuelTypeEnum = exports.transmissionEnum = exports.carStatusEnum = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const pg_core_1 = require("drizzle-orm/pg-core");
const reviewmodel_1 = require("../review/reviewmodel");
const usermodel_1 = require("../user/usermodel");
const parkingmodel_1 = require("../parking/parkingmodel");
const bookingmodel_1 = require("../booking/bookingmodel");
exports.carStatusEnum = (0, pg_core_1.pgEnum)("car_status", [
    "available",
    "booked",
    "maintenance",
    "unavailable",
]);
exports.transmissionEnum = (0, pg_core_1.pgEnum)("transmission", ["manual", "automatic"]);
exports.fuelTypeEnum = (0, pg_core_1.pgEnum)("fuel_type", [
    "petrol",
    "diesel",
    "electric",
    "hybrid",
]);
// New car catalog table for predefined car models
exports.carCatalogTable = (0, pg_core_1.pgTable)("car_catalog", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    carName: (0, pg_core_1.varchar)("car_name", { length: 255 }).notNull(),
    carMaker: (0, pg_core_1.varchar)("car_maker", { length: 255 }).notNull(),
    carModelYear: (0, pg_core_1.integer)("car_model_year").notNull(),
    carVendorPrice: (0, pg_core_1.decimal)("car_vendor_price", {
        precision: 10,
        scale: 2,
    }).notNull(), // Daily rental price vendor gets
    carPlatformPrice: (0, pg_core_1.decimal)("car_platform_price", {
        precision: 10,
        scale: 2,
    }).notNull(), // Price customers pay
    transmission: (0, exports.transmissionEnum)("transmission").notNull().default("manual"),
    fuelType: (0, exports.fuelTypeEnum)("fuel_type").notNull().default("petrol"),
    seats: (0, pg_core_1.integer)("seats").notNull().default(5),
    engineCapacity: (0, pg_core_1.varchar)("engine_capacity", { length: 50 }), // e.g., "1.5L", "2.0L"
    mileage: (0, pg_core_1.varchar)("mileage", { length: 50 }), // e.g., "15 kmpl", "20 kmpl"
    features: (0, pg_core_1.varchar)("features", { length: 1000 }), // JSON string of features like AC, GPS, etc.
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 500 }),
    isActive: (0, pg_core_1.boolean)("is_active").notNull().default(true),
    category: (0, pg_core_1.varchar)("category", { length: 100 }).default("sedan"), // sedan, suv, hatchback, luxury, etc.
    lateFeeRate: (0, pg_core_1.decimal)("late_fee_rate", {
        precision: 10,
        scale: 2,
    })
        .notNull()
        .default("0.10"), // Hourly late fee rate (default 10% of daily rate)
    createdBy: (0, pg_core_1.integer)("created_by").references(() => usermodel_1.UserTable.id, {
        onDelete: "cascade",
    }),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
exports.carModel = (0, pg_core_1.pgTable)("car", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 255 }).notNull(),
    number: (0, pg_core_1.varchar)("number", { length: 20 }).notNull().unique(),
    vendorid: (0, pg_core_1.integer)("vendorid")
        .references(() => usermodel_1.UserTable.id, { onDelete: "cascade" })
        .notNull(),
    parkingid: (0, pg_core_1.integer)("parkingid")
        .references(() => parkingmodel_1.parkingTable.id, { onDelete: "cascade" })
        .notNull(),
    color: (0, pg_core_1.varchar)("color", { length: 255 }),
    price: (0, pg_core_1.integer)("price").notNull(),
    discountprice: (0, pg_core_1.integer)("discountprice"),
    inmaintainance: (0, pg_core_1.boolean)("inmaintainance").notNull().default(false),
    isavailable: (0, pg_core_1.boolean)("isavailable").notNull().default(true),
    // Restored critical fields
    rcnumber: (0, pg_core_1.varchar)("rcnumber", { length: 255 }),
    rcimg: (0, pg_core_1.varchar)("rcimg", { length: 255 }),
    pollutionimg: (0, pg_core_1.varchar)("pollutionimg", { length: 255 }),
    insuranceimg: (0, pg_core_1.varchar)("insuranceimg", { length: 255 }),
    // Fixed images to be native PostgreSQL array of strings
    images: (0, pg_core_1.varchar)("images", { length: 255 }).array(),
    // Reference to car catalog
    catalogId: (0, pg_core_1.integer)("catalog_id").references(() => exports.carCatalogTable.id, {
        onDelete: "cascade",
    }),
    status: (0, exports.carStatusEnum)("status").notNull().default("available"),
    createdAt: (0, pg_core_1.timestamp)("created_at").notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").notNull().defaultNow(),
});
exports.carRelations = (0, drizzle_orm_1.relations)(exports.carModel, ({ one, many }) => ({
    vendor: one(usermodel_1.UserTable, {
        fields: [exports.carModel.vendorid],
        references: [usermodel_1.UserTable.id],
    }),
    parking: one(parkingmodel_1.parkingTable, {
        fields: [exports.carModel.parkingid],
        references: [parkingmodel_1.parkingTable.id],
    }),
    catalog: one(exports.carCatalogTable, {
        fields: [exports.carModel.catalogId],
        references: [exports.carCatalogTable.id],
    }),
    // Add reverse relation for bookings
    bookings: many(bookingmodel_1.bookingsTable),
    // Add reverse relation for reviews
    reviews: many(reviewmodel_1.reviewModel),
}));
exports.carCatalogRelations = (0, drizzle_orm_1.relations)(exports.carCatalogTable, ({ one, many }) => ({
    creator: one(usermodel_1.UserTable, {
        fields: [exports.carCatalogTable.createdBy],
        references: [usermodel_1.UserTable.id],
    }),
    cars: many(exports.carModel),
}));
//# sourceMappingURL=carmodel.js.map