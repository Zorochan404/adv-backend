export declare const usersRelations: import("drizzle-orm/relations").Relations<"users", {
    parking: import("drizzle-orm/relations").One<"parkings", false>;
    reviews: import("drizzle-orm/relations").Many<"review">;
    advertisements: import("drizzle-orm/relations").Many<"advertisements">;
    bookings_userId: import("drizzle-orm/relations").Many<"bookings">;
    bookings_picApprovedBy: import("drizzle-orm/relations").Many<"bookings">;
    bookings_otpVerifiedBy: import("drizzle-orm/relations").Many<"bookings">;
    topups: import("drizzle-orm/relations").Many<"topups">;
    picVerifications: import("drizzle-orm/relations").Many<"pic_verifications">;
    carCatalogs: import("drizzle-orm/relations").Many<"car_catalog">;
    cars: import("drizzle-orm/relations").Many<"car">;
}>;
export declare const parkingsRelations: import("drizzle-orm/relations").Relations<"parkings", {
    users: import("drizzle-orm/relations").Many<"users">;
    bookings_pickupParkingId: import("drizzle-orm/relations").Many<"bookings">;
    bookings_dropoffParkingId: import("drizzle-orm/relations").Many<"bookings">;
    picVerifications: import("drizzle-orm/relations").Many<"pic_verifications">;
    cars: import("drizzle-orm/relations").Many<"car">;
}>;
export declare const reviewRelations: import("drizzle-orm/relations").Relations<"review", {
    user: import("drizzle-orm/relations").One<"users", true>;
}>;
export declare const advertisementsRelations: import("drizzle-orm/relations").Relations<"advertisements", {
    user: import("drizzle-orm/relations").One<"users", false>;
}>;
export declare const bookingsRelations: import("drizzle-orm/relations").Relations<"bookings", {
    user_userId: import("drizzle-orm/relations").One<"users", true>;
    car: import("drizzle-orm/relations").One<"car", true>;
    parking_pickupParkingId: import("drizzle-orm/relations").One<"parkings", false>;
    parking_dropoffParkingId: import("drizzle-orm/relations").One<"parkings", false>;
    user_picApprovedBy: import("drizzle-orm/relations").One<"users", false>;
    user_otpVerifiedBy: import("drizzle-orm/relations").One<"users", false>;
    bookingTopups: import("drizzle-orm/relations").Many<"booking_topups">;
}>;
export declare const carRelations: import("drizzle-orm/relations").Relations<"car", {
    bookings: import("drizzle-orm/relations").Many<"bookings">;
    picVerifications: import("drizzle-orm/relations").Many<"pic_verifications">;
    user: import("drizzle-orm/relations").One<"users", true>;
    carCatalog: import("drizzle-orm/relations").One<"car_catalog", false>;
    parking: import("drizzle-orm/relations").One<"parkings", true>;
}>;
export declare const bookingTopupsRelations: import("drizzle-orm/relations").Relations<"booking_topups", {
    booking: import("drizzle-orm/relations").One<"bookings", true>;
    topup: import("drizzle-orm/relations").One<"topups", true>;
}>;
export declare const topupsRelations: import("drizzle-orm/relations").Relations<"topups", {
    bookingTopups: import("drizzle-orm/relations").Many<"booking_topups">;
    user: import("drizzle-orm/relations").One<"users", false>;
}>;
export declare const picVerificationsRelations: import("drizzle-orm/relations").Relations<"pic_verifications", {
    car: import("drizzle-orm/relations").One<"car", true>;
    parking: import("drizzle-orm/relations").One<"parkings", true>;
    user: import("drizzle-orm/relations").One<"users", true>;
}>;
export declare const carCatalogRelations: import("drizzle-orm/relations").Relations<"car_catalog", {
    user: import("drizzle-orm/relations").One<"users", false>;
    cars: import("drizzle-orm/relations").Many<"car">;
}>;
//# sourceMappingURL=relations.d.ts.map