"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.picVerificationRelations = exports.picVerificationTable = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const usermodel_1 = require("../user/usermodel");
const carmodel_1 = require("../car/carmodel");
const parkingmodel_1 = require("./parkingmodel");
// PIC (Parking In Charge) verification for vendor cars
exports.picVerificationTable = (0, pg_core_1.pgTable)("pic_verifications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Foreign keys
    carId: (0, pg_core_1.integer)("car_id")
        .notNull()
        .references(() => carmodel_1.carModel.id, { onDelete: "cascade" }),
    parkingId: (0, pg_core_1.integer)("parking_id")
        .notNull()
        .references(() => parkingmodel_1.parkingTable.id, { onDelete: "cascade" }),
    picId: (0, pg_core_1.integer)("pic_id")
        .notNull()
        .references(() => usermodel_1.UserTable.id, { onDelete: "cascade" }),
    // Verification details
    status: (0, pg_core_1.varchar)("status", { length: 50 }).default("pending"), // pending, approved, rejected, recheck
    verificationType: (0, pg_core_1.varchar)("verification_type", { length: 50 }).notNull(), // initial, recheck
    // Health check details
    engineCondition: (0, pg_core_1.varchar)("engine_condition", { length: 50 }), // excellent, good, fair, poor
    bodyCondition: (0, pg_core_1.varchar)("body_condition", { length: 50 }), // excellent, good, fair, poor
    interiorCondition: (0, pg_core_1.varchar)("interior_condition", { length: 50 }), // excellent, good, fair, poor
    tireCondition: (0, pg_core_1.varchar)("tire_condition", { length: 50 }), // excellent, good, fair, poor
    // Documentation verification
    rcVerified: (0, pg_core_1.boolean)("rc_verified").default(false),
    insuranceVerified: (0, pg_core_1.boolean)("insurance_verified").default(false),
    pollutionVerified: (0, pg_core_1.boolean)("pollution_verified").default(false),
    // Images for verification
    verificationImages: (0, pg_core_1.varchar)("verification_images", { length: 500 })
        .array()
        .default([]),
    // PIC comments and feedback
    picComments: (0, pg_core_1.text)("pic_comments"),
    vendorFeedback: (0, pg_core_1.text)("vendor_feedback"),
    // Timestamps
    verifiedAt: (0, pg_core_1.timestamp)("verified_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.picVerificationRelations = (0, drizzle_orm_1.relations)(exports.picVerificationTable, ({ one }) => ({
    car: one(carmodel_1.carModel, {
        fields: [exports.picVerificationTable.carId],
        references: [carmodel_1.carModel.id],
    }),
    parking: one(parkingmodel_1.parkingTable, {
        fields: [exports.picVerificationTable.parkingId],
        references: [parkingmodel_1.parkingTable.id],
    }),
    pic: one(usermodel_1.UserTable, {
        fields: [exports.picVerificationTable.picId],
        references: [usermodel_1.UserTable.id],
    }),
}));
//# sourceMappingURL=picmodel.js.map