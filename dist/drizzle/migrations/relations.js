"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carCatalogRelations = exports.picVerificationsRelations = exports.topupsRelations = exports.bookingTopupsRelations = exports.carRelations = exports.bookingsRelations = exports.advertisementsRelations = exports.reviewRelations = exports.parkingsRelations = exports.usersRelations = void 0;
const relations_1 = require("drizzle-orm/relations");
const schema_1 = require("./schema");
exports.usersRelations = (0, relations_1.relations)(schema_1.users, ({ one, many }) => ({
    parking: one(schema_1.parkings, {
        fields: [schema_1.users.parkingid],
        references: [schema_1.parkings.id]
    }),
    reviews: many(schema_1.review),
    advertisements: many(schema_1.advertisements),
    bookings_userId: many(schema_1.bookings, {
        relationName: "bookings_userId_users_id"
    }),
    bookings_picApprovedBy: many(schema_1.bookings, {
        relationName: "bookings_picApprovedBy_users_id"
    }),
    bookings_otpVerifiedBy: many(schema_1.bookings, {
        relationName: "bookings_otpVerifiedBy_users_id"
    }),
    topups: many(schema_1.topups),
    picVerifications: many(schema_1.picVerifications),
    carCatalogs: many(schema_1.carCatalog),
    cars: many(schema_1.car),
}));
exports.parkingsRelations = (0, relations_1.relations)(schema_1.parkings, ({ many }) => ({
    users: many(schema_1.users),
    bookings_pickupParkingId: many(schema_1.bookings, {
        relationName: "bookings_pickupParkingId_parkings_id"
    }),
    bookings_dropoffParkingId: many(schema_1.bookings, {
        relationName: "bookings_dropoffParkingId_parkings_id"
    }),
    picVerifications: many(schema_1.picVerifications),
    cars: many(schema_1.car),
}));
exports.reviewRelations = (0, relations_1.relations)(schema_1.review, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.review.userid],
        references: [schema_1.users.id]
    }),
}));
exports.advertisementsRelations = (0, relations_1.relations)(schema_1.advertisements, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.advertisements.createdBy],
        references: [schema_1.users.id]
    }),
}));
exports.bookingsRelations = (0, relations_1.relations)(schema_1.bookings, ({ one, many }) => ({
    user_userId: one(schema_1.users, {
        fields: [schema_1.bookings.userId],
        references: [schema_1.users.id],
        relationName: "bookings_userId_users_id"
    }),
    car: one(schema_1.car, {
        fields: [schema_1.bookings.carId],
        references: [schema_1.car.id]
    }),
    parking_pickupParkingId: one(schema_1.parkings, {
        fields: [schema_1.bookings.pickupParkingId],
        references: [schema_1.parkings.id],
        relationName: "bookings_pickupParkingId_parkings_id"
    }),
    parking_dropoffParkingId: one(schema_1.parkings, {
        fields: [schema_1.bookings.dropoffParkingId],
        references: [schema_1.parkings.id],
        relationName: "bookings_dropoffParkingId_parkings_id"
    }),
    user_picApprovedBy: one(schema_1.users, {
        fields: [schema_1.bookings.picApprovedBy],
        references: [schema_1.users.id],
        relationName: "bookings_picApprovedBy_users_id"
    }),
    user_otpVerifiedBy: one(schema_1.users, {
        fields: [schema_1.bookings.otpVerifiedBy],
        references: [schema_1.users.id],
        relationName: "bookings_otpVerifiedBy_users_id"
    }),
    bookingTopups: many(schema_1.bookingTopups),
}));
exports.carRelations = (0, relations_1.relations)(schema_1.car, ({ one, many }) => ({
    bookings: many(schema_1.bookings),
    picVerifications: many(schema_1.picVerifications),
    user: one(schema_1.users, {
        fields: [schema_1.car.vendorid],
        references: [schema_1.users.id]
    }),
    carCatalog: one(schema_1.carCatalog, {
        fields: [schema_1.car.catalogId],
        references: [schema_1.carCatalog.id]
    }),
    parking: one(schema_1.parkings, {
        fields: [schema_1.car.parkingid],
        references: [schema_1.parkings.id]
    }),
}));
exports.bookingTopupsRelations = (0, relations_1.relations)(schema_1.bookingTopups, ({ one }) => ({
    booking: one(schema_1.bookings, {
        fields: [schema_1.bookingTopups.bookingId],
        references: [schema_1.bookings.id]
    }),
    topup: one(schema_1.topups, {
        fields: [schema_1.bookingTopups.topupId],
        references: [schema_1.topups.id]
    }),
}));
exports.topupsRelations = (0, relations_1.relations)(schema_1.topups, ({ one, many }) => ({
    bookingTopups: many(schema_1.bookingTopups),
    user: one(schema_1.users, {
        fields: [schema_1.topups.createdBy],
        references: [schema_1.users.id]
    }),
}));
exports.picVerificationsRelations = (0, relations_1.relations)(schema_1.picVerifications, ({ one }) => ({
    car: one(schema_1.car, {
        fields: [schema_1.picVerifications.carId],
        references: [schema_1.car.id]
    }),
    parking: one(schema_1.parkings, {
        fields: [schema_1.picVerifications.parkingId],
        references: [schema_1.parkings.id]
    }),
    user: one(schema_1.users, {
        fields: [schema_1.picVerifications.picId],
        references: [schema_1.users.id]
    }),
}));
exports.carCatalogRelations = (0, relations_1.relations)(schema_1.carCatalog, ({ one, many }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.carCatalog.createdBy],
        references: [schema_1.users.id]
    }),
    cars: many(schema_1.car),
}));
//# sourceMappingURL=relations.js.map