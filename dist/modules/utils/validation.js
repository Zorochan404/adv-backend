"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = exports.advertisementFilterSchema = exports.advertisementUpdateSchema = exports.advertisementCreateSchema = exports.earningsOverviewSchema = exports.lateFeePaymentSchema = exports.topupApplySchema = exports.topupUpdateSchema = exports.topupCreateSchema = exports.bookingRescheduleSchema = exports.bookingResendOTPSchema = exports.bookingOTPVerificationSchema = exports.bookingPICApprovalSchema = exports.bookingConfirmationSchema = exports.bookingPaymentSchema = exports.bookingCreateSchema = exports.reviewQuerySchema = exports.reviewUpdateSchema = exports.reviewCreateSchema = exports.parkingLocationSchema = exports.parkingFilterSchema = exports.parkingUpdateSchema = exports.parkingCreateSchema = exports.carCatalogFilterSchema = exports.carCatalogUpdateSchema = exports.carCatalogCreateSchema = exports.carLocationSchema = exports.carFilterSchema = exports.carSearchSchema = exports.carUpdateSchema = exports.carCreateSchema = exports.passwordUpdateSchema = exports.adminLoginSchema = exports.adminRegisterSchema = exports.loginSchema = exports.parkingInchargeByNumberSchema = exports.parkingInchargeAssignSchema = exports.userRoleSchema = exports.userSearchSchema = exports.userUpdateSchema = exports.userCreateSchema = exports.picDateFilterSchema = exports.paginationQuerySchema = exports.bookingIdParamSchema = exports.parkingIdParamSchema = exports.reviewIdParamSchema = exports.carIdParamSchema = exports.idParamSchema = void 0;
const zod_1 = require("zod");
const apiError_1 = require("./apiError");
// Base schemas for common fields
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9]+$/, "Invalid ID format"),
});
exports.carIdParamSchema = zod_1.z.object({
    carid: zod_1.z.string().regex(/^[0-9]+$/, "Invalid car ID format"),
});
exports.reviewIdParamSchema = zod_1.z.object({
    reviewid: zod_1.z.string().regex(/^[0-9]+$/, "Invalid review ID format"),
});
exports.parkingIdParamSchema = zod_1.z.object({
    parkingid: zod_1.z.string().regex(/^[0-9]+$/, "Invalid parking ID format"),
});
exports.bookingIdParamSchema = zod_1.z.object({
    bookingId: zod_1.z.string().regex(/^[0-9]+$/, "Invalid booking ID format"),
});
exports.paginationQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    page: zod_1.z.coerce.number().min(1).default(1),
    sort: zod_1.z
        .enum(["createdAt", "updatedAt", "rating", "name", "price"])
        .default("createdAt"),
    order: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
// PIC date filtering schema
exports.picDateFilterSchema = zod_1.z.object({
    startDate: zod_1.z.string().datetime("Invalid start date format").optional(),
    endDate: zod_1.z.string().datetime("Invalid end date format").optional(),
    limit: zod_1.z.coerce.number().min(1).max(50).default(20),
    page: zod_1.z.coerce.number().min(1).default(1),
});
// User schemas
exports.userCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name too long"),
    email: zod_1.z.string().email("Invalid email format").optional(),
    number: zod_1.z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    password: zod_1.z
        .string()
        .min(6, "Password must be at least 6 characters")
        .optional(),
    role: zod_1.z.enum(["admin", "user", "vendor", "parkingincharge"]).default("user"),
    aadharNumber: zod_1.z.string().optional(),
    dlNumber: zod_1.z.string().optional(),
    passportNumber: zod_1.z.string().optional(),
    locality: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    pincode: zod_1.z.number().optional(),
    avatar: zod_1.z.string().url("Invalid avatar URL").optional(),
});
exports.userUpdateSchema = exports.userCreateSchema.partial();
exports.userSearchSchema = zod_1.z
    .object({
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    number: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    role: zod_1.z.enum(["user", "admin", "vendor", "parkingincharge"]).optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    locality: zod_1.z.string().optional(),
    pincode: zod_1.z.coerce.number().optional(),
    aadharnumber: zod_1.z.string().optional(),
    aadhar: zod_1.z.string().optional(),
    dlnumber: zod_1.z.string().optional(),
    dl: zod_1.z.string().optional(),
    passportnumber: zod_1.z.string().optional(),
    passport: zod_1.z.string().optional(),
    isverified: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(), // For backward compatibility
    // Pagination parameters
    page: zod_1.z.coerce.number().min(1).default(1),
    limit: zod_1.z.coerce.number().min(1).max(100).default(10),
})
    .passthrough(); // Allow any additional parameters
exports.userRoleSchema = zod_1.z.object({
    role: zod_1.z.enum(["admin", "user", "vendor", "parkingincharge"]),
});
exports.parkingInchargeAssignSchema = zod_1.z.object({
    id: zod_1.z.number().positive("Invalid user ID"),
    parkingid: zod_1.z.number().positive("Invalid parking ID"),
});
exports.parkingInchargeByNumberSchema = zod_1.z.object({
    number: zod_1.z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
});
// Auth schemas
exports.loginSchema = zod_1.z
    .object({
    number: zod_1.z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    otp: zod_1.z
        .string()
        .regex(/^[0-9]{4,6}$/, "OTP must be 4-6 digits")
        .optional(),
    password: zod_1.z.string().min(1, "Password is required").optional(),
})
    .refine((data) => {
    // Either otp or password must be provided, but not both
    const hasOtp = !!data.otp;
    const hasPassword = !!data.password;
    return (hasOtp && !hasPassword) || (!hasOtp && hasPassword);
}, {
    message: "Either OTP or password must be provided, but not both",
    path: ["otp"],
});
exports.adminRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    number: zod_1.z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    role: zod_1.z.enum(["admin", "user", "vendor", "parkingincharge"]),
});
exports.adminLoginSchema = zod_1.z.object({
    number: zod_1.z.string().regex(/^[0-9]{10}$/, "Phone number must be 10 digits"),
    password: zod_1.z.string().min(1, "Password is required"),
});
// Password update schema
exports.passwordUpdateSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(1, "Current password is required"),
    newPassword: zod_1.z
        .string()
        .min(6, "New password must be at least 6 characters"),
    confirmPassword: zod_1.z.string().min(1, "Password confirmation is required"),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation password do not match",
    path: ["confirmPassword"],
});
// Car schemas
exports.carCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Car name is required").max(100, "Car name too long"),
    number: zod_1.z.string().min(1, "Car number is required"),
    price: zod_1.z.number().positive("Price must be positive"),
    discountprice: zod_1.z
        .number()
        .positive("Discount price must be positive")
        .optional(),
    color: zod_1.z.string().optional(),
    rcnumber: zod_1.z.string().optional(),
    rcimg: zod_1.z.string().url("Invalid RC image URL").optional(),
    pollutionimg: zod_1.z.string().url("Invalid pollution image URL").optional(),
    insuranceimg: zod_1.z.string().url("Invalid insurance image URL").optional(),
    images: zod_1.z.array(zod_1.z.string().url("Invalid image URL")).optional(),
    vendorid: zod_1.z.number().positive("Invalid vendor ID"),
    parkingid: zod_1.z.number().positive("Invalid parking ID"),
    catalogId: zod_1.z.number().positive("Invalid catalog ID").optional(),
    status: zod_1.z
        .enum(["available", "booked", "maintenance", "unavailable"])
        .default("available"),
});
exports.carUpdateSchema = exports.carCreateSchema.partial().extend({
    // Allow updating catalog-related fields
    transmission: zod_1.z.enum(["manual", "automatic"]).optional(),
    fuel: zod_1.z.enum(["petrol", "diesel", "electric", "hybrid"]).optional(),
    seats: zod_1.z.number().int().positive().optional(),
    maker: zod_1.z.string().optional(),
    year: zod_1.z.number().int().positive().optional(),
    engineCapacity: zod_1.z.string().optional(),
    mileage: zod_1.z.string().optional(),
    features: zod_1.z.string().optional(),
    category: zod_1.z
        .enum(["sedan", "hatchback", "suv", "luxury", "electric"])
        .optional(),
});
exports.carSearchSchema = zod_1.z.object({
    search: zod_1.z.string().min(1, "Search term is required"),
});
exports.carFilterSchema = zod_1.z.object({
    // Basic car fields
    name: zod_1.z.string().optional(),
    number: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    status: zod_1.z
        .enum(["available", "booked", "maintenance", "unavailable"])
        .optional(),
    price_min: zod_1.z.coerce.number().positive().optional(),
    price_max: zod_1.z.coerce.number().positive().optional(),
    discountprice_min: zod_1.z.coerce.number().positive().optional(),
    discountprice_max: zod_1.z.coerce.number().positive().optional(),
    // Catalog fields
    maker: zod_1.z.string().optional(),
    year: zod_1.z.coerce.number().int().positive().optional(),
    transmission: zod_1.z.enum(["manual", "automatic"]).optional(),
    fuel: zod_1.z.enum(["petrol", "diesel", "electric", "hybrid"]).optional(),
    seats: zod_1.z.coerce.number().int().positive().optional(),
    category: zod_1.z
        .enum(["sedan", "hatchback", "suv", "luxury", "electric"])
        .optional(),
    // Location fields
    parkingid: zod_1.z.coerce.number().positive().optional(),
    vendorid: zod_1.z.coerce.number().positive().optional(),
    // Pagination
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    page: zod_1.z.coerce.number().min(1).default(1),
    sort: zod_1.z
        .enum(["name", "price", "createdAt", "updatedAt"])
        .default("createdAt"),
    order: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
exports.carLocationSchema = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90, "Invalid latitude"),
    lng: zod_1.z.coerce.number().min(-180).max(180, "Invalid longitude"),
    radius: zod_1.z.coerce.number().positive("Radius must be positive").default(500),
    limit: zod_1.z.coerce.number().positive().max(50).default(3),
    page: zod_1.z.coerce.number().positive().default(1),
});
// Car Catalog schemas
exports.carCatalogCreateSchema = zod_1.z.object({
    carName: zod_1.z.string().min(1, "Car name is required"),
    carMaker: zod_1.z.string().min(1, "Car maker is required"),
    carModelYear: zod_1.z.number().int().positive("Model year must be positive"),
    carVendorPrice: zod_1.z.number().positive("Vendor price must be positive"),
    carPlatformPrice: zod_1.z.number().positive("Platform price must be positive"),
    transmission: zod_1.z.enum(["manual", "automatic"]).default("manual"),
    fuelType: zod_1.z
        .enum(["petrol", "diesel", "electric", "hybrid"])
        .default("petrol"),
    seats: zod_1.z.number().int().positive("Seats must be positive").default(5),
    engineCapacity: zod_1.z.string().optional(),
    mileage: zod_1.z.string().optional(),
    features: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url("Invalid image URL").optional(),
    category: zod_1.z
        .enum(["sedan", "hatchback", "suv", "luxury", "electric"])
        .default("sedan"),
    lateFeeRate: zod_1.z
        .number()
        .min(0)
        .max(1, "Late fee rate must be between 0 and 1")
        .default(0.1),
});
exports.carCatalogUpdateSchema = exports.carCatalogCreateSchema.partial();
exports.carCatalogFilterSchema = zod_1.z.object({
    category: zod_1.z
        .enum(["sedan", "hatchback", "suv", "luxury", "electric"])
        .optional(),
    fuelType: zod_1.z.enum(["petrol", "diesel", "electric", "hybrid"]).optional(),
    transmission: zod_1.z.enum(["manual", "automatic"]).optional(),
    isActive: zod_1.z.enum(["true", "false"]).optional(),
});
// Parking schemas
exports.parkingCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Parking name is required"),
    locality: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    pincode: zod_1.z.number().optional(),
    capacity: zod_1.z.number().positive("Capacity must be positive").optional(),
    mainimg: zod_1.z.string().url("Invalid main image URL").optional(),
    images: zod_1.z.array(zod_1.z.string().url("Invalid image URL")).optional(),
    lat: zod_1.z.number().min(-90).max(90, "Invalid latitude"),
    lng: zod_1.z.number().min(-180).max(180, "Invalid longitude"),
});
exports.parkingUpdateSchema = exports.parkingCreateSchema.partial();
exports.parkingFilterSchema = zod_1.z.object({
    state: zod_1.z.string().optional(),
    pincode: zod_1.z.coerce.number().optional(),
    name: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    locality: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
});
exports.parkingLocationSchema = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90, "Invalid latitude"),
    lng: zod_1.z.coerce.number().min(-180).max(180, "Invalid longitude"),
    radius: zod_1.z.coerce.number().positive("Radius must be positive").default(500),
    limit: zod_1.z.coerce.number().min(1).max(50).default(10),
    page: zod_1.z.coerce.number().min(1).default(1),
});
// Review schemas
exports.reviewCreateSchema = zod_1.z.object({
    rating: zod_1.z.number().min(1).max(5, "Rating must be between 1 and 5"),
    comment: zod_1.z
        .string()
        .min(1, "Comment is required")
        .max(500, "Comment too long"),
});
exports.reviewUpdateSchema = exports.reviewCreateSchema;
exports.reviewQuerySchema = exports.paginationQuerySchema.extend({
    sort: zod_1.z.enum(["createdAt", "updatedAt", "rating"]).default("createdAt"),
});
// Booking schemas
exports.bookingCreateSchema = zod_1.z.object({
    carId: zod_1.z.number().positive("Invalid car ID"),
    startDate: zod_1.z.string().datetime("Invalid start date"),
    endDate: zod_1.z.string().datetime("Invalid end date"),
    pickupParkingId: zod_1.z.number().positive("Invalid pickup parking ID").optional(),
    dropoffParkingId: zod_1.z
        .number()
        .positive("Invalid dropoff parking ID")
        .optional(),
    deliveryType: zod_1.z.enum(["pickup", "delivery"]).default("pickup"),
    deliveryAddress: zod_1.z.string().optional(),
    deliveryCharges: zod_1.z
        .number()
        .positive("Delivery charges must be positive")
        .optional(),
});
exports.bookingPaymentSchema = zod_1.z.object({
    bookingId: zod_1.z.number().positive("Invalid booking ID"),
    paymentReferenceId: zod_1.z.string().min(1, "Payment reference ID is required"),
});
exports.bookingConfirmationSchema = zod_1.z.object({
    bookingId: zod_1.z.number().positive("Invalid booking ID"),
    carConditionImages: zod_1.z
        .array(zod_1.z.string().url("Invalid image URL"))
        .min(1, "At least one image required"),
    tools: zod_1.z
        .array(zod_1.z.object({
        name: zod_1.z.string().min(1, "Tool name is required"),
        imageUrl: zod_1.z.string().url("Invalid tool image URL"),
    }))
        .optional(),
});
exports.bookingPICApprovalSchema = zod_1.z.object({
    bookingId: zod_1.z.number().positive("Invalid booking ID"),
    approved: zod_1.z.boolean(),
    comments: zod_1.z.string().optional(),
});
exports.bookingOTPVerificationSchema = zod_1.z.object({
    bookingId: zod_1.z.number().positive("Invalid booking ID"),
    otp: zod_1.z.string().regex(/^\d{4}$/, "OTP must be a 4-digit number"),
});
exports.bookingResendOTPSchema = zod_1.z.object({
    bookingId: zod_1.z.number().positive("Invalid booking ID"),
});
exports.bookingRescheduleSchema = zod_1.z.object({
    newPickupDate: zod_1.z.string().datetime("Invalid pickup date format"),
    newStartDate: zod_1.z.string().datetime("Invalid start date format").optional(),
    newEndDate: zod_1.z.string().datetime("Invalid end date format").optional(),
});
// Topup schemas
exports.topupCreateSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Topup name is required"),
    description: zod_1.z.string().optional(),
    duration: zod_1.z.number().positive("Duration must be positive"),
    price: zod_1.z.number().positive("Price must be positive"),
    category: zod_1.z.enum(["extension", "feature", "service"]).default("extension"),
});
exports.topupUpdateSchema = exports.topupCreateSchema.partial();
exports.topupApplySchema = zod_1.z.object({
    bookingId: zod_1.z.coerce.number().positive("Invalid booking ID"),
    topupId: zod_1.z.coerce.number().positive("Invalid topup ID"),
    paymentReferenceId: zod_1.z.string().min(1, "Payment reference ID is required"),
});
exports.lateFeePaymentSchema = zod_1.z.object({
    bookingId: zod_1.z.coerce.number().positive("Invalid booking ID"),
    paymentReferenceId: zod_1.z.string().min(1, "Payment reference ID is required"),
});
exports.earningsOverviewSchema = zod_1.z.object({
    startDate: zod_1.z
        .string()
        .optional()
        .transform((val) => {
        if (!val)
            return undefined;
        // Handle various date formats
        let date;
        if (val.includes("T")) {
            // ISO format
            date = new Date(val);
        }
        else {
            // Simple date format (YYYY-MM-DD)
            date = new Date(val + "T00:00:00.000Z");
        }
        return isNaN(date.getTime()) ? undefined : date;
    }),
    endDate: zod_1.z
        .string()
        .optional()
        .transform((val) => {
        if (!val)
            return undefined;
        // Handle various date formats
        let date;
        if (val.includes("T")) {
            // ISO format
            date = new Date(val);
        }
        else {
            // Simple date format (YYYY-MM-DD)
            date = new Date(val + "T23:59:59.999Z");
        }
        return isNaN(date.getTime()) ? undefined : date;
    }),
});
// Advertisement schemas
exports.advertisementCreateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required").max(100, "Title too long"),
    description: zod_1.z
        .string()
        .min(1, "Description is required")
        .max(500, "Description too long"),
    imageUrl: zod_1.z.string().url("Invalid image URL"),
    linkUrl: zod_1.z.string().url("Invalid link URL").optional(),
    adType: zod_1.z.enum(["banner", "popup", "carousel"]).default("banner"),
    startDate: zod_1.z.string().datetime("Invalid start date"),
    endDate: zod_1.z.string().datetime("Invalid end date"),
    isActive: zod_1.z.boolean().default(true),
});
exports.advertisementUpdateSchema = exports.advertisementCreateSchema.partial();
exports.advertisementFilterSchema = zod_1.z.object({
    status: zod_1.z.enum(["active", "inactive", "expired"]).optional(),
    adType: zod_1.z.enum(["banner", "popup", "carousel"]).optional(),
    isActive: zod_1.z.enum(["true", "false"]).optional(),
    location: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(50).optional(),
});
// Validation middleware
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            let data;
            // Validate based on request type
            if (req.method === "GET") {
                data = { ...req.params, ...req.query };
            }
            else {
                data = { ...req.params, ...req.body };
            }
            const result = schema.safeParse(data);
            if (!result.success) {
                const errorMessages = result.error.issues
                    .map((err) => `${err.path.join(".")}: ${err.message}`)
                    .join(", ");
                const validationError = apiError_1.ApiError.badRequest(`Validation failed: ${errorMessages}`);
                // Check if headers have already been sent
                if (!res.headersSent) {
                    return res.status(validationError.statusCode).json({
                        success: false,
                        message: validationError.message,
                        statusCode: validationError.statusCode,
                        timestamp: new Date(),
                        path: req.path,
                        method: req.method,
                    });
                }
            }
            else {
                // Replace request data with validated data
                Object.assign(req, result.data);
                next();
            }
        }
        catch (error) {
            const genericError = apiError_1.ApiError.badRequest("Invalid request data");
            // Check if headers have already been sent
            if (!res.headersSent) {
                return res.status(genericError.statusCode).json({
                    success: false,
                    message: genericError.message,
                    statusCode: genericError.statusCode,
                    timestamp: new Date(),
                    path: req.path,
                    method: req.method,
                });
            }
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map