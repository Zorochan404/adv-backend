import { z } from "zod";
import { Request, Response, NextFunction } from "express";
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export declare const carIdParamSchema: z.ZodObject<{
    carid: z.ZodString;
}, z.core.$strip>;
export declare const reviewIdParamSchema: z.ZodObject<{
    reviewid: z.ZodString;
}, z.core.$strip>;
export declare const parkingIdParamSchema: z.ZodObject<{
    parkingid: z.ZodString;
}, z.core.$strip>;
export declare const bookingIdParamSchema: z.ZodObject<{
    bookingId: z.ZodString;
}, z.core.$strip>;
export declare const paginationQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sort: z.ZodDefault<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        rating: "rating";
        price: "price";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const picDateFilterSchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const userCreateSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    number: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<{
        user: "user";
        admin: "admin";
        vendor: "vendor";
        parkingincharge: "parkingincharge";
    }>>;
    aadharNumber: z.ZodOptional<z.ZodString>;
    dlNumber: z.ZodOptional<z.ZodString>;
    passportNumber: z.ZodOptional<z.ZodString>;
    locality: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodNumber>;
    avatar: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const userUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    number: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    role: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        user: "user";
        admin: "admin";
        vendor: "vendor";
        parkingincharge: "parkingincharge";
    }>>>;
    aadharNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dlNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    passportNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    locality: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pincode: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    avatar: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const userSearchSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    number: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<{
        user: "user";
        admin: "admin";
        vendor: "vendor";
        parkingincharge: "parkingincharge";
    }>>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    locality: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    aadharnumber: z.ZodOptional<z.ZodString>;
    aadhar: z.ZodOptional<z.ZodString>;
    dlnumber: z.ZodOptional<z.ZodString>;
    dl: z.ZodOptional<z.ZodString>;
    passportnumber: z.ZodOptional<z.ZodString>;
    passport: z.ZodOptional<z.ZodString>;
    isverified: z.ZodOptional<z.ZodCoercedBoolean<unknown>>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$loose>;
export declare const userRoleSchema: z.ZodObject<{
    role: z.ZodEnum<{
        user: "user";
        admin: "admin";
        vendor: "vendor";
        parkingincharge: "parkingincharge";
    }>;
}, z.core.$strip>;
export declare const parkingInchargeAssignSchema: z.ZodObject<{
    id: z.ZodNumber;
    parkingid: z.ZodNumber;
}, z.core.$strip>;
export declare const parkingInchargeByNumberSchema: z.ZodObject<{
    number: z.ZodString;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    number: z.ZodString;
    otp: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const adminRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    number: z.ZodString;
    password: z.ZodString;
    role: z.ZodEnum<{
        user: "user";
        admin: "admin";
        vendor: "vendor";
        parkingincharge: "parkingincharge";
    }>;
}, z.core.$strip>;
export declare const adminLoginSchema: z.ZodObject<{
    number: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const passwordUpdateSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, z.core.$strip>;
export declare const carCreateSchema: z.ZodObject<{
    name: z.ZodString;
    number: z.ZodString;
    price: z.ZodNumber;
    discountprice: z.ZodOptional<z.ZodNumber>;
    color: z.ZodOptional<z.ZodString>;
    rcnumber: z.ZodOptional<z.ZodString>;
    rcimg: z.ZodOptional<z.ZodString>;
    pollutionimg: z.ZodOptional<z.ZodString>;
    insuranceimg: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
    vendorid: z.ZodNumber;
    parkingid: z.ZodNumber;
    catalogId: z.ZodOptional<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<{
        available: "available";
        booked: "booked";
        maintenance: "maintenance";
        unavailable: "unavailable";
    }>>;
}, z.core.$strip>;
export declare const carUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    number: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    discountprice: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    color: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    rcnumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    rcimg: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pollutionimg: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    insuranceimg: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    vendorid: z.ZodOptional<z.ZodNumber>;
    parkingid: z.ZodOptional<z.ZodNumber>;
    catalogId: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        available: "available";
        booked: "booked";
        maintenance: "maintenance";
        unavailable: "unavailable";
    }>>>;
    transmission: z.ZodOptional<z.ZodEnum<{
        manual: "manual";
        automatic: "automatic";
    }>>;
    fuel: z.ZodOptional<z.ZodEnum<{
        petrol: "petrol";
        diesel: "diesel";
        electric: "electric";
        hybrid: "hybrid";
    }>>;
    seats: z.ZodOptional<z.ZodNumber>;
    maker: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    engineCapacity: z.ZodOptional<z.ZodString>;
    mileage: z.ZodOptional<z.ZodString>;
    features: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<{
        electric: "electric";
        sedan: "sedan";
        hatchback: "hatchback";
        suv: "suv";
        luxury: "luxury";
    }>>;
}, z.core.$strip>;
export declare const carSearchSchema: z.ZodObject<{
    search: z.ZodString;
}, z.core.$strip>;
export declare const carFilterSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    number: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<{
        available: "available";
        booked: "booked";
        maintenance: "maintenance";
        unavailable: "unavailable";
    }>>;
    price_min: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    price_max: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    discountprice_min: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    discountprice_max: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    maker: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    transmission: z.ZodOptional<z.ZodEnum<{
        manual: "manual";
        automatic: "automatic";
    }>>;
    fuel: z.ZodOptional<z.ZodEnum<{
        petrol: "petrol";
        diesel: "diesel";
        electric: "electric";
        hybrid: "hybrid";
    }>>;
    seats: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    category: z.ZodOptional<z.ZodEnum<{
        electric: "electric";
        sedan: "sedan";
        hatchback: "hatchback";
        suv: "suv";
        luxury: "luxury";
    }>>;
    parkingid: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    vendorid: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    sort: z.ZodDefault<z.ZodEnum<{
        name: "name";
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        price: "price";
    }>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
}, z.core.$strip>;
export declare const carLocationSchema: z.ZodObject<{
    lat: z.ZodCoercedNumber<unknown>;
    lng: z.ZodCoercedNumber<unknown>;
    radius: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const carCatalogCreateSchema: z.ZodObject<{
    carName: z.ZodString;
    carMaker: z.ZodString;
    carModelYear: z.ZodNumber;
    carVendorPrice: z.ZodNumber;
    carPlatformPrice: z.ZodNumber;
    transmission: z.ZodDefault<z.ZodEnum<{
        manual: "manual";
        automatic: "automatic";
    }>>;
    fuelType: z.ZodDefault<z.ZodEnum<{
        petrol: "petrol";
        diesel: "diesel";
        electric: "electric";
        hybrid: "hybrid";
    }>>;
    seats: z.ZodDefault<z.ZodNumber>;
    engineCapacity: z.ZodOptional<z.ZodString>;
    mileage: z.ZodOptional<z.ZodString>;
    features: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    category: z.ZodDefault<z.ZodEnum<{
        electric: "electric";
        sedan: "sedan";
        hatchback: "hatchback";
        suv: "suv";
        luxury: "luxury";
    }>>;
    lateFeeRate: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export declare const carCatalogUpdateSchema: z.ZodObject<{
    carName: z.ZodOptional<z.ZodString>;
    carMaker: z.ZodOptional<z.ZodString>;
    carModelYear: z.ZodOptional<z.ZodNumber>;
    carVendorPrice: z.ZodOptional<z.ZodNumber>;
    carPlatformPrice: z.ZodOptional<z.ZodNumber>;
    transmission: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        manual: "manual";
        automatic: "automatic";
    }>>>;
    fuelType: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        petrol: "petrol";
        diesel: "diesel";
        electric: "electric";
        hybrid: "hybrid";
    }>>>;
    seats: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    engineCapacity: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    mileage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    features: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        electric: "electric";
        sedan: "sedan";
        hatchback: "hatchback";
        suv: "suv";
        luxury: "luxury";
    }>>>;
    lateFeeRate: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, z.core.$strip>;
export declare const carCatalogFilterSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<{
        electric: "electric";
        sedan: "sedan";
        hatchback: "hatchback";
        suv: "suv";
        luxury: "luxury";
    }>>;
    fuelType: z.ZodOptional<z.ZodEnum<{
        petrol: "petrol";
        diesel: "diesel";
        electric: "electric";
        hybrid: "hybrid";
    }>>;
    transmission: z.ZodOptional<z.ZodEnum<{
        manual: "manual";
        automatic: "automatic";
    }>>;
    isActive: z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
}, z.core.$strip>;
export declare const parkingCreateSchema: z.ZodObject<{
    name: z.ZodString;
    locality: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodNumber>;
    capacity: z.ZodOptional<z.ZodNumber>;
    mainimg: z.ZodOptional<z.ZodString>;
    images: z.ZodOptional<z.ZodArray<z.ZodString>>;
    lat: z.ZodNumber;
    lng: z.ZodNumber;
}, z.core.$strip>;
export declare const parkingUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    locality: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pincode: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    capacity: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    mainimg: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    lat: z.ZodOptional<z.ZodNumber>;
    lng: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const parkingFilterSchema: z.ZodObject<{
    state: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
    name: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    locality: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const parkingLocationSchema: z.ZodObject<{
    lat: z.ZodCoercedNumber<unknown>;
    lng: z.ZodCoercedNumber<unknown>;
    radius: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const reviewCreateSchema: z.ZodObject<{
    rating: z.ZodNumber;
    comment: z.ZodString;
}, z.core.$strip>;
export declare const reviewUpdateSchema: z.ZodObject<{
    rating: z.ZodNumber;
    comment: z.ZodString;
}, z.core.$strip>;
export declare const reviewQuerySchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    page: z.ZodDefault<z.ZodCoercedNumber<unknown>>;
    order: z.ZodDefault<z.ZodEnum<{
        asc: "asc";
        desc: "desc";
    }>>;
    sort: z.ZodDefault<z.ZodEnum<{
        createdAt: "createdAt";
        updatedAt: "updatedAt";
        rating: "rating";
    }>>;
}, z.core.$strip>;
export declare const bookingCreateSchema: z.ZodObject<{
    carId: z.ZodNumber;
    startDate: z.ZodString;
    endDate: z.ZodString;
    pickupParkingId: z.ZodOptional<z.ZodNumber>;
    dropoffParkingId: z.ZodOptional<z.ZodNumber>;
    deliveryType: z.ZodDefault<z.ZodEnum<{
        pickup: "pickup";
        delivery: "delivery";
    }>>;
    deliveryAddress: z.ZodOptional<z.ZodString>;
    deliveryCharges: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
export declare const bookingPaymentSchema: z.ZodObject<{
    bookingId: z.ZodNumber;
    paymentReferenceId: z.ZodString;
}, z.core.$strip>;
export declare const bookingConfirmationSchema: z.ZodObject<{
    bookingId: z.ZodNumber;
    carConditionImages: z.ZodArray<z.ZodString>;
    tools: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        imageUrl: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const bookingPICApprovalSchema: z.ZodObject<{
    bookingId: z.ZodNumber;
    approved: z.ZodBoolean;
    comments: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const bookingOTPVerificationSchema: z.ZodObject<{
    bookingId: z.ZodNumber;
    otp: z.ZodString;
}, z.core.$strip>;
export declare const bookingResendOTPSchema: z.ZodObject<{
    bookingId: z.ZodNumber;
}, z.core.$strip>;
export declare const bookingRescheduleSchema: z.ZodObject<{
    newPickupDate: z.ZodString;
    newStartDate: z.ZodOptional<z.ZodString>;
    newEndDate: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const topupCreateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    duration: z.ZodNumber;
    price: z.ZodNumber;
    category: z.ZodDefault<z.ZodEnum<{
        extension: "extension";
        feature: "feature";
        service: "service";
    }>>;
}, z.core.$strip>;
export declare const topupUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    duration: z.ZodOptional<z.ZodNumber>;
    price: z.ZodOptional<z.ZodNumber>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        extension: "extension";
        feature: "feature";
        service: "service";
    }>>>;
}, z.core.$strip>;
export declare const topupApplySchema: z.ZodObject<{
    bookingId: z.ZodCoercedNumber<unknown>;
    topupId: z.ZodCoercedNumber<unknown>;
    paymentReferenceId: z.ZodString;
}, z.core.$strip>;
export declare const lateFeePaymentSchema: z.ZodObject<{
    bookingId: z.ZodCoercedNumber<unknown>;
    paymentReferenceId: z.ZodString;
}, z.core.$strip>;
export declare const earningsOverviewSchema: z.ZodObject<{
    startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    endDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
}, z.core.$strip>;
export declare const advertisementCreateSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    imageUrl: z.ZodString;
    linkUrl: z.ZodOptional<z.ZodString>;
    adType: z.ZodDefault<z.ZodEnum<{
        banner: "banner";
        carousel: "carousel";
        popup: "popup";
    }>>;
    startDate: z.ZodString;
    endDate: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strip>;
export declare const advertisementUpdateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    imageUrl: z.ZodOptional<z.ZodString>;
    linkUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    adType: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        banner: "banner";
        carousel: "carousel";
        popup: "popup";
    }>>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const advertisementFilterSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<{
        active: "active";
        inactive: "inactive";
        expired: "expired";
    }>>;
    adType: z.ZodOptional<z.ZodEnum<{
        banner: "banner";
        carousel: "carousel";
        popup: "popup";
    }>>;
    isActive: z.ZodOptional<z.ZodEnum<{
        true: "true";
        false: "false";
    }>>;
    location: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const validateRequest: <T extends z.ZodSchema>(schema: T) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type CarCreateInput = z.infer<typeof carCreateSchema>;
export type CarUpdateInput = z.infer<typeof carUpdateSchema>;
export type CarCatalogCreateInput = z.infer<typeof carCatalogCreateSchema>;
export type CarCatalogUpdateInput = z.infer<typeof carCatalogUpdateSchema>;
export type ParkingCreateInput = z.infer<typeof parkingCreateSchema>;
export type ParkingUpdateInput = z.infer<typeof parkingUpdateSchema>;
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type TopupCreateInput = z.infer<typeof topupCreateSchema>;
export type TopupUpdateInput = z.infer<typeof topupUpdateSchema>;
export type AdvertisementCreateInput = z.infer<typeof advertisementCreateSchema>;
export type AdvertisementUpdateInput = z.infer<typeof advertisementUpdateSchema>;
//# sourceMappingURL=validation.d.ts.map