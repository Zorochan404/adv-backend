"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.car = exports.carCatalog = exports.picVerifications = exports.topups = exports.bookingTopups = exports.bookings = exports.advertisements = exports.review = exports.parkings = exports.users = exports.userRole = exports.transmission = exports.fuelType = exports.carStatus = exports.adType = exports.adStatus = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.adStatus = (0, pg_core_1.pgEnum)("ad_status", ['active', 'inactive', 'pending', 'expired']);
exports.adType = (0, pg_core_1.pgEnum)("ad_type", ['banner', 'carousel', 'popup', 'sidebar']);
exports.carStatus = (0, pg_core_1.pgEnum)("car_status", ['available', 'booked', 'maintenance', 'unavailable']);
exports.fuelType = (0, pg_core_1.pgEnum)("fuel_type", ['petrol', 'diesel', 'electric', 'hybrid']);
exports.transmission = (0, pg_core_1.pgEnum)("transmission", ['manual', 'automatic']);
exports.userRole = (0, pg_core_1.pgEnum)("user_role", ['user', 'admin', 'vendor', 'parkingincharge']);
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.varchar)(),
    avatar: (0, pg_core_1.varchar)(),
    age: (0, pg_core_1.integer)(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    number: (0, pg_core_1.bigint)({ mode: "number" }),
    email: (0, pg_core_1.varchar)(),
    password: (0, pg_core_1.varchar)().default('123456'),
    aadharNumber: (0, pg_core_1.varchar)("aadhar_number"),
    aadharImg: (0, pg_core_1.varchar)("aadhar_img"),
    dlNumber: (0, pg_core_1.varchar)("dl_number"),
    dlImg: (0, pg_core_1.varchar)("dl_img"),
    passportNumber: (0, pg_core_1.varchar)("passport_number"),
    passportImg: (0, pg_core_1.varchar)("passport_img"),
    lat: (0, pg_core_1.doublePrecision)(),
    lng: (0, pg_core_1.doublePrecision)(),
    locality: (0, pg_core_1.varchar)(),
    city: (0, pg_core_1.varchar)(),
    state: (0, pg_core_1.varchar)(),
    country: (0, pg_core_1.varchar)(),
    pincode: (0, pg_core_1.integer)(),
    role: (0, exports.userRole)().default('user'),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    parkingid: (0, pg_core_1.integer)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.parkingid],
        foreignColumns: [exports.parkings.id],
        name: "users_parkingid_parkings_id_fk"
    }).onDelete("cascade"),
]);
exports.parkings = (0, pg_core_1.pgTable)("parkings", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    locality: (0, pg_core_1.varchar)(),
    city: (0, pg_core_1.varchar)(),
    state: (0, pg_core_1.varchar)(),
    country: (0, pg_core_1.varchar)(),
    pincode: (0, pg_core_1.integer)(),
    capacity: (0, pg_core_1.integer)().notNull(),
    mainimg: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    images: (0, pg_core_1.jsonb)().notNull(),
    lat: (0, pg_core_1.doublePrecision)().notNull(),
    lng: (0, pg_core_1.doublePrecision)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
});
exports.review = (0, pg_core_1.pgTable)("review", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    carid: (0, pg_core_1.integer)().notNull(),
    userid: (0, pg_core_1.integer)().notNull(),
    rating: (0, pg_core_1.integer)(),
    comment: (0, pg_core_1.varchar)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.userid],
        foreignColumns: [exports.users.id],
        name: "review_userid_users_id_fk"
    }).onDelete("cascade"),
]);
exports.advertisements = (0, pg_core_1.pgTable)("advertisements", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    title: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    description: (0, pg_core_1.text)(),
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 500 }).notNull(),
    videoUrl: (0, pg_core_1.varchar)("video_url", { length: 500 }),
    linkUrl: (0, pg_core_1.varchar)("link_url", { length: 500 }),
    adType: (0, exports.adType)("ad_type").default('banner').notNull(),
    status: (0, exports.adStatus)().default('pending').notNull(),
    priority: (0, pg_core_1.integer)().default(1).notNull(),
    startDate: (0, pg_core_1.timestamp)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, pg_core_1.timestamp)("end_date", { mode: 'string' }).notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    clickCount: (0, pg_core_1.integer)("click_count").default(0).notNull(),
    viewCount: (0, pg_core_1.integer)("view_count").default(0).notNull(),
    targetAudience: (0, pg_core_1.varchar)("target_audience", { length: 100 }),
    location: (0, pg_core_1.varchar)({ length: 100 }),
    createdBy: (0, pg_core_1.integer)("created_by"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.createdBy],
        foreignColumns: [exports.users.id],
        name: "advertisements_created_by_users_id_fk"
    }).onDelete("cascade"),
]);
exports.bookings = (0, pg_core_1.pgTable)("bookings", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    carId: (0, pg_core_1.integer)("car_id").notNull(),
    startDate: (0, pg_core_1.timestamp)("start_date", { mode: 'string' }).notNull(),
    endDate: (0, pg_core_1.timestamp)("end_date", { mode: 'string' }).notNull(),
    totalPrice: (0, pg_core_1.doublePrecision)("total_price").notNull(),
    extensionPrice: (0, pg_core_1.doublePrecision)("extension_price").default(0),
    status: (0, pg_core_1.varchar)({ length: 50 }).default('pending'),
    pickupParkingId: (0, pg_core_1.integer)("pickup_parking_id"),
    dropoffParkingId: (0, pg_core_1.integer)("dropoff_parking_id"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    basePrice: (0, pg_core_1.doublePrecision)("base_price").notNull(),
    advanceAmount: (0, pg_core_1.doublePrecision)("advance_amount").notNull(),
    remainingAmount: (0, pg_core_1.doublePrecision)("remaining_amount").notNull(),
    extensionTill: (0, pg_core_1.timestamp)("extension_till", { mode: 'string' }),
    extensionTime: (0, pg_core_1.integer)("extension_time"),
    confirmationStatus: (0, pg_core_1.varchar)("confirmation_status", { length: 50 }).default('pending'),
    advancePaymentStatus: (0, pg_core_1.varchar)("advance_payment_status", { length: 50 }).default('pending'),
    finalPaymentStatus: (0, pg_core_1.varchar)("final_payment_status", { length: 50 }).default('pending'),
    advancePaymentReferenceId: (0, pg_core_1.varchar)("advance_payment_reference_id", { length: 100 }),
    finalPaymentReferenceId: (0, pg_core_1.varchar)("final_payment_reference_id", { length: 100 }),
    carConditionImages: (0, pg_core_1.varchar)("car_condition_images", { length: 500 }).array().default([""]),
    toolImages: (0, pg_core_1.varchar)("tool_images", { length: 500 }).array().default([""]),
    tools: (0, pg_core_1.varchar)({ length: 500 }).array().default([""]),
    picApproved: (0, pg_core_1.boolean)("pic_approved").default(false),
    picApprovedAt: (0, pg_core_1.timestamp)("pic_approved_at", { mode: 'string' }),
    picApprovedBy: (0, pg_core_1.integer)("pic_approved_by"),
    picComments: (0, pg_core_1.varchar)("pic_comments", { length: 500 }),
    userConfirmed: (0, pg_core_1.boolean)("user_confirmed").default(false),
    userConfirmedAt: (0, pg_core_1.timestamp)("user_confirmed_at", { mode: 'string' }),
    deliveryType: (0, pg_core_1.varchar)("delivery_type", { length: 50 }).default('pickup'),
    deliveryAddress: (0, pg_core_1.varchar)("delivery_address", { length: 500 }),
    deliveryCharges: (0, pg_core_1.doublePrecision)("delivery_charges").default(0),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
    pickupDate: (0, pg_core_1.timestamp)("pickup_date", { mode: 'string' }),
    actualPickupDate: (0, pg_core_1.timestamp)("actual_pickup_date", { mode: 'string' }),
    originalPickupDate: (0, pg_core_1.timestamp)("original_pickup_date", { mode: 'string' }),
    rescheduleCount: (0, pg_core_1.integer)("reschedule_count").default(0),
    maxRescheduleCount: (0, pg_core_1.integer)("max_reschedule_count").default(3),
    otpCode: (0, pg_core_1.varchar)("otp_code", { length: 4 }),
    otpExpiresAt: (0, pg_core_1.timestamp)("otp_expires_at", { mode: 'string' }),
    otpVerified: (0, pg_core_1.boolean)("otp_verified").default(false),
    otpVerifiedAt: (0, pg_core_1.timestamp)("otp_verified_at", { mode: 'string' }),
    otpVerifiedBy: (0, pg_core_1.integer)("otp_verified_by"),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.userId],
        foreignColumns: [exports.users.id],
        name: "bookings_user_id_users_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.carId],
        foreignColumns: [exports.car.id],
        name: "bookings_car_id_car_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.pickupParkingId],
        foreignColumns: [exports.parkings.id],
        name: "bookings_pickup_parking_id_parkings_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.dropoffParkingId],
        foreignColumns: [exports.parkings.id],
        name: "bookings_dropoff_parking_id_parkings_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.picApprovedBy],
        foreignColumns: [exports.users.id],
        name: "bookings_pic_approved_by_users_id_fk"
    }),
    (0, pg_core_1.foreignKey)({
        columns: [table.otpVerifiedBy],
        foreignColumns: [exports.users.id],
        name: "bookings_otp_verified_by_users_id_fk"
    }),
]);
exports.bookingTopups = (0, pg_core_1.pgTable)("booking_topups", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    bookingId: (0, pg_core_1.integer)("booking_id").notNull(),
    topupId: (0, pg_core_1.integer)("topup_id").notNull(),
    appliedAt: (0, pg_core_1.timestamp)("applied_at", { mode: 'string' }).notNull(),
    originalEndDate: (0, pg_core_1.timestamp)("original_end_date", { mode: 'string' }).notNull(),
    newEndDate: (0, pg_core_1.timestamp)("new_end_date", { mode: 'string' }).notNull(),
    amount: (0, pg_core_1.doublePrecision)().notNull(),
    paymentStatus: (0, pg_core_1.varchar)("payment_status", { length: 50 }).default('pending'),
    paymentReferenceId: (0, pg_core_1.varchar)("payment_reference_id", { length: 100 }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.bookingId],
        foreignColumns: [exports.bookings.id],
        name: "booking_topups_booking_id_bookings_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.topupId],
        foreignColumns: [exports.topups.id],
        name: "booking_topups_topup_id_topups_id_fk"
    }).onDelete("cascade"),
]);
exports.topups = (0, pg_core_1.pgTable)("topups", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.varchar)({ length: 100 }).notNull(),
    description: (0, pg_core_1.varchar)({ length: 500 }),
    duration: (0, pg_core_1.integer)().notNull(),
    price: (0, pg_core_1.doublePrecision)().notNull(),
    category: (0, pg_core_1.varchar)({ length: 50 }).default('extension'),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdBy: (0, pg_core_1.integer)("created_by"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.createdBy],
        foreignColumns: [exports.users.id],
        name: "topups_created_by_users_id_fk"
    }),
]);
exports.picVerifications = (0, pg_core_1.pgTable)("pic_verifications", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    carId: (0, pg_core_1.integer)("car_id").notNull(),
    parkingId: (0, pg_core_1.integer)("parking_id").notNull(),
    picId: (0, pg_core_1.integer)("pic_id").notNull(),
    status: (0, pg_core_1.varchar)({ length: 50 }).default('pending'),
    verificationType: (0, pg_core_1.varchar)("verification_type", { length: 50 }).notNull(),
    engineCondition: (0, pg_core_1.varchar)("engine_condition", { length: 50 }),
    bodyCondition: (0, pg_core_1.varchar)("body_condition", { length: 50 }),
    interiorCondition: (0, pg_core_1.varchar)("interior_condition", { length: 50 }),
    tireCondition: (0, pg_core_1.varchar)("tire_condition", { length: 50 }),
    rcVerified: (0, pg_core_1.boolean)("rc_verified").default(false),
    insuranceVerified: (0, pg_core_1.boolean)("insurance_verified").default(false),
    pollutionVerified: (0, pg_core_1.boolean)("pollution_verified").default(false),
    verificationImages: (0, pg_core_1.varchar)("verification_images", { length: 500 }).array().default([""]),
    picComments: (0, pg_core_1.text)("pic_comments"),
    vendorFeedback: (0, pg_core_1.text)("vendor_feedback"),
    verifiedAt: (0, pg_core_1.timestamp)("verified_at", { mode: 'string' }),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.carId],
        foreignColumns: [exports.car.id],
        name: "pic_verifications_car_id_car_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.parkingId],
        foreignColumns: [exports.parkings.id],
        name: "pic_verifications_parking_id_parkings_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.picId],
        foreignColumns: [exports.users.id],
        name: "pic_verifications_pic_id_users_id_fk"
    }).onDelete("cascade"),
]);
exports.carCatalog = (0, pg_core_1.pgTable)("car_catalog", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    carName: (0, pg_core_1.varchar)("car_name", { length: 255 }).notNull(),
    carMaker: (0, pg_core_1.varchar)("car_maker", { length: 255 }).notNull(),
    carModelYear: (0, pg_core_1.integer)("car_model_year").notNull(),
    carVendorPrice: (0, pg_core_1.numeric)("car_vendor_price", { precision: 10, scale: 2 }).notNull(),
    carPlatformPrice: (0, pg_core_1.numeric)("car_platform_price", { precision: 10, scale: 2 }).notNull(),
    transmission: (0, exports.transmission)().default('manual').notNull(),
    fuelType: (0, exports.fuelType)("fuel_type").default('petrol').notNull(),
    seats: (0, pg_core_1.integer)().default(5).notNull(),
    engineCapacity: (0, pg_core_1.varchar)("engine_capacity", { length: 50 }),
    mileage: (0, pg_core_1.varchar)({ length: 50 }),
    features: (0, pg_core_1.varchar)({ length: 1000 }),
    imageUrl: (0, pg_core_1.varchar)("image_url", { length: 500 }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true).notNull(),
    category: (0, pg_core_1.varchar)({ length: 100 }).default('sedan'),
    createdBy: (0, pg_core_1.integer)("created_by"),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.createdBy],
        foreignColumns: [exports.users.id],
        name: "car_catalog_created_by_users_id_fk"
    }).onDelete("cascade"),
]);
exports.car = (0, pg_core_1.pgTable)("car", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.varchar)({ length: 255 }).notNull(),
    price: (0, pg_core_1.integer)().notNull(),
    inmaintainance: (0, pg_core_1.boolean)().default(false).notNull(),
    isavailable: (0, pg_core_1.boolean)().default(true).notNull(),
    images: (0, pg_core_1.varchar)({ length: 255 }).array(),
    vendorid: (0, pg_core_1.integer)().notNull(),
    parkingid: (0, pg_core_1.integer)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at", { mode: 'string' }).defaultNow().notNull(),
    number: (0, pg_core_1.varchar)({ length: 20 }).default('CAR-001').notNull(),
    discountprice: (0, pg_core_1.integer)(),
    catalogId: (0, pg_core_1.integer)("catalog_id"),
    status: (0, exports.carStatus)().default('available').notNull(),
    rcnumber: (0, pg_core_1.varchar)({ length: 255 }),
    rcimg: (0, pg_core_1.varchar)({ length: 255 }),
    pollutionimg: (0, pg_core_1.varchar)({ length: 255 }),
    insuranceimg: (0, pg_core_1.varchar)({ length: 255 }),
    color: (0, pg_core_1.varchar)({ length: 255 }),
}, (table) => [
    (0, pg_core_1.foreignKey)({
        columns: [table.vendorid],
        foreignColumns: [exports.users.id],
        name: "car_vendorid_users_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.catalogId],
        foreignColumns: [exports.carCatalog.id],
        name: "car_catalog_id_car_catalog_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.foreignKey)({
        columns: [table.parkingid],
        foreignColumns: [exports.parkings.id],
        name: "car_parkingid_parkings_id_fk"
    }).onDelete("cascade"),
    (0, pg_core_1.unique)("car_number_unique").on(table.number),
]);
//# sourceMappingURL=schema.js.map