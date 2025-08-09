"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDropoffCars = exports.getPickupCars = exports.applyTopupToBooking = exports.checkBookingOverdue = exports.getEarningsOverview = exports.confirmCarReturn = exports.payLateFees = exports.calculateLateFees = exports.confirmCarPickup = exports.getUserBookingsWithStatus = exports.getBookingStatus = exports.getUserRejectedConfirmations = exports.resubmitConfirmationRequest = exports.getPICConfirmationRequests = exports.getPICByEntity = exports.rescheduleBooking = exports.getBookingOTP = exports.resendBookingOTP = exports.verifyBookingOTP = exports.getPICDashboard = exports.confirmFinalPayment = exports.picApproveConfirmation = exports.submitConfirmationRequest = exports.confirmAdvancePayment = exports.getbookingbydropoffParkingId = exports.getbookingbypickupParkingId = exports.getbookingbycarid = exports.getbookingbyuserid = exports.getbookingbyid = exports.deletebooking = exports.updatebooking = exports.getBookingByDateRangeByCarId = exports.getBookingByDateRange = exports.createBooking = void 0;
const db_1 = require("../../drizzle/db");
const bookingmodel_1 = require("./bookingmodel");
const asyncHandler_1 = require("../utils/asyncHandler");
const drizzle_orm_1 = require("drizzle-orm");
const carmodel_1 = require("../car/carmodel");
const parkingmodel_1 = require("../parking/parkingmodel");
const apiError_1 = require("../utils/apiError");
const responseHandler_1 = require("../utils/responseHandler");
const otpUtils_1 = require("../utils/otpUtils");
const usermodel_1 = require("../user/usermodel");
const topupmodel_1 = require("./topupmodel");
// Helper function to clean up tools data
const cleanToolsData = (tools) => {
    if (!tools || !Array.isArray(tools)) {
        return [];
    }
    // If tools is already in the correct format (array of objects), return as is
    if (tools.length > 0 && typeof tools[0] === "object" && tools[0] !== null) {
        return tools;
    }
    // If tools is in the old format (array of strings like "[object Object]"), return empty array
    if (tools.length > 0 &&
        typeof tools[0] === "string" &&
        tools[0].includes("[object Object]")) {
        return [];
    }
    return tools;
};
exports.createBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { carId, startDate, endDate, deliveryCharges = 0 } = req.body;
    // Validate required fields
    if (!carId || !startDate || !endDate) {
        throw apiError_1.ApiError.badRequest("Car ID, start date, and end date are required");
    }
    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw apiError_1.ApiError.badRequest("Invalid date format");
    }
    if (startDateObj >= endDateObj) {
        throw apiError_1.ApiError.badRequest("End date must be after start date");
    }
    // Get car details
    const carprice = await db_1.db
        .select()
        .from(carmodel_1.carModel)
        .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, carId));
    if (!carprice || carprice.length === 0) {
        throw apiError_1.ApiError.notFound("Car not found");
    }
    // Check if user is verified
    if (req.user.isverified === false) {
        throw apiError_1.ApiError.forbidden("Please login and verify your account to continue");
    }
    // Check for overlapping bookings for the same car
    const overlappingBookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq, and, lte, gte }) => and(eq(bookingsTable.carId, carId), lte(bookingsTable.startDate, endDateObj), gte(bookingsTable.endDate, startDateObj), 
        // Only check active bookings (not cancelled)
        (0, drizzle_orm_1.sql) `${bookingsTable.status} NOT IN ('cancelled')`),
    });
    if (overlappingBookings.length > 0) {
        throw apiError_1.ApiError.conflict("Car is already booked for the selected dates");
    }
    // Calculate pricing
    const days = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = (carprice[0]?.discountprice || carprice[0]?.price || 0) * days;
    const advancePercentage = 0.3; // 30% advance payment (configurable by admin)
    const advanceAmount = basePrice * advancePercentage;
    const remainingAmount = basePrice - advanceAmount;
    const totalPrice = basePrice + deliveryCharges;
    // Get car details to get parking ID
    const carDetails = await db_1.db
        .select({
        parkingId: carmodel_1.carModel.parkingid,
    })
        .from(carmodel_1.carModel)
        .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, carId));
    if (!carDetails || carDetails.length === 0) {
        throw apiError_1.ApiError.notFound("Car not found");
    }
    const parkingId = carDetails[0].parkingId;
    const newBooking = await db_1.db
        .insert(bookingmodel_1.bookingsTable)
        .values({
        carId: carId,
        userId: Number(req.user.id),
        pickupParkingId: parkingId,
        dropoffParkingId: parkingId, // Same as pickup for now
        startDate: startDateObj,
        endDate: endDateObj,
        basePrice: basePrice,
        advanceAmount: advanceAmount,
        remainingAmount: remainingAmount,
        totalPrice: totalPrice,
        status: "pending",
        advancePaymentStatus: "pending",
        confirmationStatus: "pending",
        finalPaymentStatus: "pending",
        deliveryCharges: deliveryCharges,
        createdAt: new Date(),
        updatedAt: new Date(),
    })
        .returning();
    return (0, responseHandler_1.sendCreated)(res, newBooking[0], "Booking created successfully");
});
exports.getBookingByDateRange = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.body;
    // Validate input
    if (!startDate || !endDate) {
        throw apiError_1.ApiError.badRequest("Start date and end date are required");
    }
    // Convert string dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw apiError_1.ApiError.badRequest("Invalid date format");
    }
    const bookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { and, lte, gte }) => and(lte(bookingsTable.startDate, endDateObj), gte(bookingsTable.endDate, startDateObj)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: {
                columns: {
                    id: true,
                    name: true,
                    avatar: true,
                    age: true,
                    number: true,
                    email: true,
                    aadharNumber: true,
                    aadharimg: true,
                    dlNumber: true,
                    dlimg: true,
                    passportNumber: true,
                    passportimg: true,
                    lat: true,
                    lng: true,
                    locality: true,
                    city: true,
                    state: true,
                    country: true,
                    pincode: true,
                    role: true,
                    isverified: true,
                    parkingid: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
    return (0, responseHandler_1.sendList)(res, bookings, bookings.length, "Bookings fetched successfully");
});
exports.getBookingByDateRangeByCarId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, carId } = req.body;
    // Validate input
    if (!startDate || !endDate || !carId) {
        throw apiError_1.ApiError.badRequest("Start date, end date, and car ID are required");
    }
    // Convert string dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw apiError_1.ApiError.badRequest("Invalid date format");
    }
    const bookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { and, lte, gte, eq }) => and(eq(bookingsTable.carId, carId), lte(bookingsTable.startDate, endDateObj), gte(bookingsTable.endDate, startDateObj)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: {
                columns: {
                    id: true,
                    name: true,
                    avatar: true,
                    age: true,
                    number: true,
                    email: true,
                    aadharNumber: true,
                    aadharimg: true,
                    dlNumber: true,
                    dlimg: true,
                    passportNumber: true,
                    passportimg: true,
                    lat: true,
                    lng: true,
                    locality: true,
                    city: true,
                    state: true,
                    country: true,
                    pincode: true,
                    role: true,
                    isverified: true,
                    parkingid: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });
    return (0, responseHandler_1.sendList)(res, bookings, bookings.length, "Bookings fetched successfully");
});
exports.updatebooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    // Validate date formats if provided
    if (updateData.startDate) {
        const startDate = new Date(updateData.startDate);
        if (isNaN(startDate.getTime())) {
            throw apiError_1.ApiError.badRequest("Invalid startDate format");
        }
        updateData.startDate = startDate;
    }
    if (updateData.endDate) {
        const endDate = new Date(updateData.endDate);
        if (isNaN(endDate.getTime())) {
            throw apiError_1.ApiError.badRequest("Invalid endDate format");
        }
        updateData.endDate = endDate;
    }
    if (updateData.extensionTill) {
        const extensionTill = new Date(updateData.extensionTill);
        if (isNaN(extensionTill.getTime())) {
            throw apiError_1.ApiError.badRequest("Invalid extensionTill format");
        }
        updateData.extensionTill = extensionTill;
    }
    const booking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, parseInt(id)))
        .returning();
    if (!booking || booking.length === 0) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    return (0, responseHandler_1.sendUpdated)(res, booking[0], "Booking updated successfully");
});
exports.deletebooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    const booking = await db_1.db
        .delete(bookingmodel_1.bookingsTable)
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, parseInt(id)))
        .returning();
    if (!booking || booking.length === 0) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    return (0, responseHandler_1.sendDeleted)(res, "Booking deleted successfully");
});
exports.getbookingbyid = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(id)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: true,
        },
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    // Clean up tools data
    const cleanedBooking = {
        ...booking,
        tools: cleanToolsData(booking.tools),
    };
    return (0, responseHandler_1.sendItem)(res, cleanedBooking, "Booking fetched successfully");
});
exports.getbookingbyuserid = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { userid } = req.params;
    // Validate user ID
    if (!userid || !/^[0-9]+$/.test(userid)) {
        throw apiError_1.ApiError.badRequest("Invalid user ID");
    }
    const bookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) => eq(bookingsTable.userId, parseInt(userid)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: true,
        },
    });
    // Clean up tools data for all bookings
    const cleanedBookings = bookings.map((booking) => ({
        ...booking,
        tools: cleanToolsData(booking.tools),
    }));
    return (0, responseHandler_1.sendList)(res, cleanedBookings, cleanedBookings.length, "Bookings fetched successfully");
});
exports.getbookingbycarid = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { carid } = req.params;
    // Validate car ID
    if (!carid || !/^[0-9]+$/.test(carid)) {
        throw apiError_1.ApiError.badRequest("Invalid car ID");
    }
    const bookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) => eq(bookingsTable.carId, parseInt(carid)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: true,
        },
    });
    // Clean up tools data for all bookings
    const cleanedBookings = bookings.map((booking) => ({
        ...booking,
        tools: cleanToolsData(booking.tools),
    }));
    return (0, responseHandler_1.sendList)(res, cleanedBookings, cleanedBookings.length, "Bookings fetched successfully");
});
exports.getbookingbypickupParkingId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate parking ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    const bookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) => eq(bookingsTable.pickupParkingId, parseInt(id)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: true,
        },
    });
    return (0, responseHandler_1.sendList)(res, bookings, bookings.length, "Bookings fetched successfully");
});
exports.getbookingbydropoffParkingId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate parking ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    const bookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) => eq(bookingsTable.dropoffParkingId, parseInt(id)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: true,
        },
    });
    return (0, responseHandler_1.sendList)(res, bookings, bookings.length, "Bookings fetched successfully");
});
// New booking flow functions
exports.confirmAdvancePayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, paymentReferenceId } = req.body;
    if (!bookingId || !paymentReferenceId) {
        throw apiError_1.ApiError.badRequest("Booking ID and payment reference ID are required");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only confirm payments for your own bookings");
    }
    if (booking.advancePaymentStatus === "paid") {
        throw apiError_1.ApiError.conflict("Advance payment already confirmed");
    }
    // Generate OTP for user identification at pickup location
    const otpCode = (0, otpUtils_1.generateOTP)();
    const otpExpiresAt = (0, otpUtils_1.getOTPExpirationForPickup)(booking.pickupDate || booking.startDate);
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        advancePaymentStatus: "paid",
        advancePaymentReferenceId: paymentReferenceId,
        status: "advance_paid",
        otpCode: otpCode,
        otpExpiresAt: otpExpiresAt,
        otpVerified: false,
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], "Advance payment confirmed successfully. OTP generated for pickup verification.");
});
exports.submitConfirmationRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, carConditionImages, tools, toolImages } = req.body;
    if (!bookingId) {
        throw apiError_1.ApiError.badRequest("Booking ID is required");
    }
    if (!carConditionImages || !Array.isArray(carConditionImages)) {
        throw apiError_1.ApiError.badRequest("Car condition images are required");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only submit confirmation requests for your own bookings");
    }
    if (booking.advancePaymentStatus !== "paid") {
        throw apiError_1.ApiError.badRequest("Advance payment must be completed before submitting confirmation request");
    }
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        carConditionImages: carConditionImages,
        tools: tools || [],
        toolImages: toolImages || [],
        userConfirmed: true,
        userConfirmedAt: new Date(),
        confirmationStatus: "pending_approval",
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], "Confirmation request submitted successfully");
});
exports.picApproveConfirmation = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, approved, comments } = req.body;
    if (!bookingId || approved === undefined) {
        throw apiError_1.ApiError.badRequest("Booking ID and approval status are required");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    if (booking.confirmationStatus !== "pending_approval") {
        throw apiError_1.ApiError.badRequest("Booking is not pending approval");
    }
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        picApproved: approved,
        picApprovedAt: new Date(),
        picApprovedBy: req.user.id,
        picComments: comments || null,
        confirmationStatus: approved ? "approved" : "rejected",
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    const message = approved
        ? "Booking approved successfully"
        : "Booking rejected";
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], message);
});
exports.confirmFinalPayment = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, paymentReferenceId } = req.body;
    if (!bookingId || !paymentReferenceId) {
        throw apiError_1.ApiError.badRequest("Booking ID and payment reference ID are required");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only confirm payments for your own bookings");
    }
    if (booking.confirmationStatus !== "approved") {
        throw apiError_1.ApiError.badRequest("Booking must be approved before final payment");
    }
    if (booking.finalPaymentStatus === "paid") {
        throw apiError_1.ApiError.conflict("Final payment already confirmed");
    }
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        finalPaymentStatus: "paid",
        finalPaymentReferenceId: paymentReferenceId,
        status: "confirmed",
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], "Final payment confirmed successfully");
});
exports.getPICDashboard = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const picId = req.user.id;
    const picParkingId = req.user.parkingid;
    if (!picParkingId) {
        throw apiError_1.ApiError.badRequest("PIC must be assigned to a parking lot");
    }
    // Get PIC's assigned parking lot details
    const parkingLot = await db_1.db
        .select()
        .from(parkingmodel_1.parkingTable)
        .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, picParkingId))
        .limit(1);
    // Get all cars in PIC's parking lot
    const cars = await db_1.db.query.carModel.findMany({
        where: (carModel, { eq }) => eq(carModel.parkingid, picParkingId),
        with: {
            vendor: true,
            parking: true,
            catalog: true,
        },
    });
    // Get all bookings for cars in PIC's parking lot
    const rawBookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { inArray }) => cars.length > 0
            ? inArray(bookingsTable.carId, cars.map((car) => car.id))
            : undefined,
        with: {
            car: true,
            user: true,
            pickupParking: true,
            dropoffParking: true,
        },
    });
    // Clean up tools data for all bookings
    const bookings = rawBookings.map((booking) => ({
        ...booking,
        tools: cleanToolsData(booking.tools),
    }));
    // Get pending OTP verifications (bookings that need PIC verification)
    const pendingOTPVerifications = bookings.filter((booking) => booking.status === "advance_paid" &&
        !booking.otpVerified &&
        booking.otpCode);
    // Get active bookings (confirmed and ongoing)
    const activeBookings = bookings.filter((booking) => booking.status && ["confirmed", "active"].includes(booking.status));
    // Get completed bookings
    const completedBookings = bookings.filter((booking) => booking.status === "completed");
    // Get cancelled bookings
    const cancelledBookings = bookings.filter((booking) => booking.status === "cancelled");
    // Get statistics
    const stats = {
        totalCars: cars.length,
        availableCars: cars.filter((car) => car.status === "available").length,
        bookedCars: cars.filter((car) => car.status === "booked").length,
        maintenanceCars: cars.filter((car) => car.status === "maintenance")
            .length,
        totalBookings: bookings.length,
        pendingVerifications: pendingOTPVerifications.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        cancelledBookings: cancelledBookings.length,
    };
    return (0, responseHandler_1.sendSuccess)(res, {
        parkingLot: parkingLot[0] || null,
        cars,
        bookings,
        pendingOTPVerifications,
        activeBookings,
        completedBookings,
        cancelledBookings,
        stats,
    }, "PIC dashboard data retrieved successfully");
});
exports.verifyBookingOTP = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, otp } = req.body;
    const picId = req.user.id;
    // Validate required fields
    if (!bookingId || !otp) {
        throw apiError_1.ApiError.badRequest("Booking ID and OTP are required");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
        with: {
            car: true,
            user: true,
            pickupParking: true,
            dropoffParking: true,
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const bookingData = result;
    // Check if user is PIC (Parking In Charge)
    if (req.user.role !== "parkingincharge") {
        throw apiError_1.ApiError.forbidden("Only Parking In Charge can verify OTP");
    }
    // Get car details to find the parking lot
    const car = await db_1.db.query.carModel.findFirst({
        where: (carModel, { eq }) => eq(carModel.id, bookingData.carId),
        with: {
            vendor: true,
            parking: true,
            catalog: true,
        },
    });
    if (!car) {
        throw apiError_1.ApiError.notFound("Car not found");
    }
    const carData = car;
    // Check if PIC belongs to the parking lot where the car is located
    if (carData.parkingid !== req.user.parkingid) {
        throw apiError_1.ApiError.forbidden("You can only verify OTP for cars in your assigned parking lot");
    }
    // Verify OTP
    (0, otpUtils_1.verifyOTP)(otp, bookingData.otpCode, bookingData.otpExpiresAt, bookingData.otpVerified || false);
    // Update booking with OTP verification
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        otpVerified: true,
        otpVerifiedAt: new Date(),
        otpVerifiedBy: picId,
        status: "confirmed", // Change status to confirmed after OTP verification
        // Don't automatically set confirmationStatus to "approved" - this should be a separate step
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], "OTP verified successfully. User can now collect the car.");
});
exports.resendBookingOTP = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.body;
    // Validate required fields
    if (!bookingId) {
        throw apiError_1.ApiError.badRequest("Booking ID is required");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
        with: {
            car: true,
            user: true,
            pickupParking: true,
            dropoffParking: true,
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const bookingData = result;
    // Check if user owns this booking
    if (bookingData.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only resend OTP for your own bookings");
    }
    // Check if booking is in correct status
    if (bookingData.status !== "advance_paid") {
        throw apiError_1.ApiError.badRequest("OTP can only be resent for bookings with advance payment completed");
    }
    // Generate new OTP
    const newOTP = (0, otpUtils_1.generateOTP)();
    const newExpirationTime = (0, otpUtils_1.getOTPExpirationTime)();
    // Update booking with new OTP
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        otpCode: newOTP,
        otpExpiresAt: newExpirationTime,
        otpVerified: false,
        otpVerifiedAt: null,
        otpVerifiedBy: null,
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], "New OTP generated successfully");
});
exports.getBookingOTP = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    // Validate booking ID
    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(bookingId)),
        with: {
            car: true,
            user: true,
            pickupParking: true,
            dropoffParking: true,
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const bookingData = result;
    // Check if user owns this booking
    if (bookingData.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only view OTP for your own bookings");
    }
    // Check if booking is in correct status
    if (bookingData.status !== "advance_paid") {
        throw apiError_1.ApiError.badRequest("OTP is only available for bookings with advance payment completed");
    }
    // Check if OTP is already verified
    if (bookingData.otpVerified) {
        throw apiError_1.ApiError.badRequest("OTP has already been verified");
    }
    // Check if OTP is expired
    if (bookingData.otpExpiresAt && bookingData.otpExpiresAt < new Date()) {
        throw apiError_1.ApiError.badRequest("OTP has expired. Please request a new one");
    }
    return (0, responseHandler_1.sendItem)(res, {
        bookingId: bookingData.id,
        otp: bookingData.otpCode,
        expiresAt: bookingData.otpExpiresAt,
        isVerified: bookingData.otpVerified,
    }, "OTP retrieved successfully");
});
exports.rescheduleBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    const { newPickupDate, newStartDate, newEndDate } = req.body;
    // Validate required fields
    if (!newPickupDate) {
        throw apiError_1.ApiError.badRequest("New pickup date is required");
    }
    // Validate pickup date
    const newPickupDateObj = new Date(newPickupDate);
    if (isNaN(newPickupDateObj.getTime())) {
        throw apiError_1.ApiError.badRequest("Invalid pickup date format");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(bookingId)),
        with: {
            car: true,
            user: true,
            pickupParking: true,
            dropoffParking: true,
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const bookingData = result;
    // Check if user owns this booking
    if (bookingData.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only reschedule your own bookings");
    }
    // Check if booking can be rescheduled
    if (bookingData.status === "completed" ||
        bookingData.status === "cancelled") {
        throw apiError_1.ApiError.badRequest("Cannot reschedule completed or cancelled bookings");
    }
    // Check reschedule limit
    if ((bookingData.rescheduleCount || 0) >=
        (bookingData.maxRescheduleCount || 3)) {
        throw apiError_1.ApiError.badRequest(`Maximum reschedule limit (${bookingData.maxRescheduleCount || 3}) reached`);
    }
    // Check if new pickup date is in the future
    if (newPickupDateObj <= new Date()) {
        throw apiError_1.ApiError.badRequest("Pickup date must be in the future");
    }
    // Check for car availability on new dates
    const newStartDateObj = newStartDate
        ? new Date(newStartDate)
        : bookingData.startDate;
    const newEndDateObj = newEndDate
        ? new Date(newEndDate)
        : bookingData.endDate;
    if (newStartDateObj >= newEndDateObj) {
        throw apiError_1.ApiError.badRequest("End date must be after start date");
    }
    // Check for overlapping bookings
    const overlappingBookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq, and, lte, gte, ne }) => and(eq(bookingsTable.carId, bookingData.carId), ne(bookingsTable.id, parseInt(bookingId)), // Exclude current booking
        lte(bookingsTable.startDate, newEndDateObj), gte(bookingsTable.endDate, newStartDateObj), (0, drizzle_orm_1.sql) `${bookingsTable.status} NOT IN ('cancelled')`),
    });
    if (overlappingBookings.length > 0) {
        throw apiError_1.ApiError.conflict("Car is already booked for the selected dates");
    }
    // Store original pickup date if this is the first reschedule
    const originalPickupDate = bookingData.originalPickupDate || bookingData.pickupDate;
    // Check if OTP needs to be regenerated
    const shouldRegenerate = (0, otpUtils_1.shouldRegenerateOTP)(bookingData.otpExpiresAt, newPickupDateObj);
    // Prepare update data
    const updateData = {
        pickupDate: newPickupDateObj,
        originalPickupDate: originalPickupDate,
        rescheduleCount: (bookingData.rescheduleCount || 0) + 1,
        updatedAt: new Date(),
    };
    // Update dates if provided
    if (newStartDate) {
        updateData.startDate = newStartDateObj;
    }
    if (newEndDate) {
        updateData.endDate = newEndDateObj;
    }
    // Regenerate OTP if needed
    if (shouldRegenerate) {
        updateData.otpCode = (0, otpUtils_1.generateOTP)();
        updateData.otpExpiresAt = (0, otpUtils_1.getOTPExpirationForPickup)(newPickupDateObj);
        updateData.otpVerified = false;
        updateData.otpVerifiedAt = null;
        updateData.otpVerifiedBy = null;
    }
    // Update booking
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set(updateData)
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, parseInt(bookingId)))
        .returning();
    const message = shouldRegenerate
        ? "Booking rescheduled successfully. New OTP has been generated."
        : "Booking rescheduled successfully.";
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], message);
});
exports.getPICByEntity = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { carId, bookingId, parkingId } = req.query;
    // Validate that at least one parameter is provided
    if (!carId && !bookingId && !parkingId) {
        throw apiError_1.ApiError.badRequest("Please provide either carId, bookingId, or parkingId");
    }
    let targetParkingId = null;
    // Determine parking ID based on input
    if (parkingId) {
        // Direct parking ID provided
        targetParkingId = Number(parkingId);
    }
    else if (carId) {
        // Get parking ID from car
        const car = await db_1.db.query.carModel.findFirst({
            where: (carModel, { eq }) => eq(carModel.id, Number(carId)),
            with: {
                vendor: true,
                parking: true,
                catalog: true,
            },
        });
        if (!car) {
            throw apiError_1.ApiError.notFound("Car not found");
        }
        targetParkingId = car.parkingid;
    }
    else if (bookingId) {
        // Get parking ID from booking's car
        const booking = await db_1.db.query.bookingsTable.findFirst({
            where: (bookingsTable, { eq }) => eq(bookingsTable.id, Number(bookingId)),
            with: {
                car: true,
                pickupParking: true,
                dropoffParking: true,
            },
        });
        if (!booking) {
            throw apiError_1.ApiError.notFound("Booking not found");
        }
        const car = await db_1.db.query.carModel.findFirst({
            where: (carModel, { eq }) => eq(carModel.id, booking.carId),
            with: {
                vendor: true,
                parking: true,
                catalog: true,
            },
        });
        if (!car) {
            throw apiError_1.ApiError.notFound("Car not found for this booking");
        }
        targetParkingId = car.parkingid;
    }
    if (!targetParkingId) {
        throw apiError_1.ApiError.notFound("Could not determine parking lot");
    }
    // Get PIC assigned to this parking lot
    const pic = await db_1.db
        .select({
        id: usermodel_1.UserTable.id,
        name: usermodel_1.UserTable.name,
        email: usermodel_1.UserTable.email,
        number: usermodel_1.UserTable.number,
        role: usermodel_1.UserTable.role,
        parkingid: usermodel_1.UserTable.parkingid,
        isverified: usermodel_1.UserTable.isverified,
        createdAt: usermodel_1.UserTable.createdAt,
    })
        .from(usermodel_1.UserTable)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(usermodel_1.UserTable.role, "parkingincharge"), (0, drizzle_orm_1.eq)(usermodel_1.UserTable.parkingid, targetParkingId)))
        .limit(1);
    if (!pic || pic.length === 0) {
        throw apiError_1.ApiError.notFound("No Parking In Charge assigned to this parking lot");
    }
    // Get parking lot details
    const parkingLot = await db_1.db
        .select()
        .from(parkingmodel_1.parkingTable)
        .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, targetParkingId))
        .limit(1);
    return (0, responseHandler_1.sendItem)(res, {
        pic: pic[0],
        parkingLot: parkingLot[0] || null,
        source: {
            carId: carId || null,
            bookingId: bookingId || null,
            parkingId: parkingId || null,
        },
    }, "PIC information retrieved successfully");
});
exports.getPICConfirmationRequests = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const picId = req.user.id;
    const picParkingId = req.user.parkingid;
    if (!picParkingId) {
        throw apiError_1.ApiError.badRequest("PIC must be assigned to a parking lot");
    }
    // Get all cars in PIC's parking lot
    const cars = await db_1.db.query.carModel.findMany({
        where: (carModel, { eq }) => eq(carModel.parkingid, picParkingId),
        with: {
            vendor: true,
            parking: true,
            catalog: true,
        },
    });
    if (cars.length === 0) {
        return (0, responseHandler_1.sendSuccess)(res, {
            confirmationRequests: [],
            stats: {
                totalRequests: 0,
                pendingApproval: 0,
                approved: 0,
                rejected: 0,
            },
        }, "Confirmation requests retrieved successfully");
    }
    // Get all bookings for cars in PIC's parking lot that have confirmation requests
    const rawBookings = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { and, inArray, eq }) => and(inArray(bookingsTable.carId, cars.map((car) => car.id)), eq(bookingsTable.confirmationStatus, "pending_approval")),
        with: {
            car: {
                with: {
                    vendor: true,
                    parking: true,
                    catalog: true,
                },
            },
            user: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    number: true,
                    role: true,
                    isverified: true,
                },
            },
            pickupParking: true,
            dropoffParking: true,
        },
        orderBy: (bookingsTable, { desc }) => [
            desc(bookingsTable.userConfirmedAt),
        ],
    });
    // Clean up tools data for all bookings
    const bookings = rawBookings.map((booking) => ({
        ...booking,
        tools: cleanToolsData(booking.tools),
    }));
    // Get statistics
    const stats = {
        totalRequests: bookings.length,
        pendingApproval: bookings.filter((booking) => booking.confirmationStatus === "pending_approval").length,
        approved: bookings.filter((booking) => booking.confirmationStatus === "approved").length,
        rejected: bookings.filter((booking) => booking.confirmationStatus === "rejected").length,
    };
    return (0, responseHandler_1.sendSuccess)(res, {
        confirmationRequests: bookings,
        stats,
    }, "Confirmation requests retrieved successfully");
});
exports.resubmitConfirmationRequest = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, carConditionImages, tools, toolImages, resubmissionReason, } = req.body;
    if (!bookingId) {
        throw apiError_1.ApiError.badRequest("Booking ID is required");
    }
    if (!carConditionImages || !Array.isArray(carConditionImages)) {
        throw apiError_1.ApiError.badRequest("Car condition images are required");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only resubmit confirmation requests for your own bookings");
    }
    // Check if booking was previously rejected
    if (booking.confirmationStatus !== "rejected") {
        throw apiError_1.ApiError.badRequest("Only rejected confirmation requests can be resubmitted");
    }
    // Check if advance payment is completed
    if (booking.advancePaymentStatus !== "paid") {
        throw apiError_1.ApiError.badRequest("Advance payment must be completed before resubmitting confirmation request");
    }
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        carConditionImages: carConditionImages,
        tools: tools || [],
        toolImages: toolImages || [],
        userConfirmed: true,
        userConfirmedAt: new Date(),
        confirmationStatus: "pending_approval",
        picApproved: false, // Reset PIC approval
        picApprovedAt: null, // Reset PIC approval timestamp
        picApprovedBy: null, // Reset PIC approver
        picComments: resubmissionReason || null, // Store resubmission reason
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], "Confirmation request resubmitted successfully");
});
exports.getUserRejectedConfirmations = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const result = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { and, eq }) => and(eq(bookingsTable.userId, userId), eq(bookingsTable.confirmationStatus, "rejected")),
        with: {
            car: {
                with: {
                    vendor: true,
                    parking: true,
                    catalog: true,
                },
            },
            pickupParking: true,
            dropoffParking: true,
        },
        orderBy: (bookingsTable, { desc }) => [desc(bookingsTable.picApprovedAt)],
    });
    // Clean up tools data for all bookings
    const cleanedBookings = result.map((booking) => ({
        ...booking,
        tools: cleanToolsData(booking.tools),
    }));
    return (0, responseHandler_1.sendSuccess)(res, {
        rejectedConfirmations: cleanedBookings,
        totalRejected: cleanedBookings.length,
    }, "Rejected confirmation requests retrieved successfully");
});
exports.getBookingStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(bookingId)),
        with: {
            car: {
                with: {
                    vendor: true,
                    parking: true,
                    catalog: true,
                },
            },
            pickupParking: true,
            dropoffParking: true,
            user: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    number: true,
                },
            },
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const booking = result;
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only view your own booking status");
    }
    // Clean up tools data
    const cleanedBooking = {
        ...booking,
        tools: cleanToolsData(booking.tools),
    };
    // Calculate booking progress and status
    const statusInfo = calculateBookingStatus(cleanedBooking);
    return (0, responseHandler_1.sendSuccess)(res, {
        booking: cleanedBooking,
        statusInfo,
    }, "Booking status retrieved successfully");
});
// Helper function to calculate comprehensive booking status
const calculateBookingStatus = (booking) => {
    const statusInfo = {
        // Overall booking status
        overallStatus: booking.status,
        confirmationStatus: booking.confirmationStatus,
        // Payment status
        advancePaymentStatus: booking.advancePaymentStatus,
        finalPaymentStatus: booking.finalPaymentStatus,
        // Progress tracking
        progress: {
            advancePayment: false,
            otpVerification: false,
            userConfirmation: false,
            picApproval: false,
            finalPayment: false,
            carPickup: false,
        },
        // Next steps
        nextSteps: [],
        currentStep: "",
        isCompleted: false,
        canProceed: false,
        // Status messages (now always includes all steps)
        statusMessages: [],
    };
    // 1. Advance payment - always show
    if (booking.advancePaymentStatus === "paid") {
        statusInfo.progress.advancePayment = true;
        statusInfo.statusMessages.push("✅ Advance payment completed");
    }
    else {
        statusInfo.nextSteps.push("Complete advance payment to proceed");
        statusInfo.statusMessages.push("⏳ Advance payment pending");
    }
    // 2. OTP verification - always show
    if (booking.otpVerified) {
        statusInfo.progress.otpVerification = true;
        statusInfo.statusMessages.push("✅ OTP verified");
    }
    else {
        statusInfo.statusMessages.push("⏳ OTP verification pending");
        if (booking.otpCode && booking.advancePaymentStatus === "paid") {
            statusInfo.nextSteps.push("Verify OTP at pickup location");
        }
    }
    // 3. User confirmation - always show
    if (booking.userConfirmed) {
        statusInfo.progress.userConfirmation = true;
        statusInfo.statusMessages.push("✅ User confirmation submitted");
    }
    else {
        statusInfo.statusMessages.push("⏳ User confirmation pending");
        if (booking.otpVerified && booking.advancePaymentStatus === "paid") {
            statusInfo.nextSteps.push("Submit car condition confirmation");
        }
    }
    // 4. PIC approval - always show
    if (booking.userConfirmed && booking.confirmationStatus === "approved") {
        statusInfo.progress.picApproval = true;
        statusInfo.statusMessages.push("✅ PIC approval completed");
    }
    else if (booking.userConfirmed &&
        booking.confirmationStatus === "rejected") {
        statusInfo.nextSteps.push("Resubmit confirmation request");
        statusInfo.statusMessages.push("❌ Confirmation rejected by PIC");
    }
    else if (booking.userConfirmed &&
        booking.confirmationStatus === "pending_approval") {
        statusInfo.nextSteps.push("Wait for PIC approval");
        statusInfo.statusMessages.push("⏳ PIC approval pending");
    }
    else {
        // User hasn't confirmed yet, so PIC approval is not applicable yet
        statusInfo.statusMessages.push("⏳ PIC approval pending");
    }
    // 5. Final payment - always show
    if (booking.finalPaymentStatus === "paid") {
        statusInfo.progress.finalPayment = true;
        statusInfo.statusMessages.push("✅ Final payment completed");
    }
    else {
        statusInfo.statusMessages.push("⏳ Final payment pending");
        if (booking.userConfirmed && booking.confirmationStatus === "approved") {
            statusInfo.nextSteps.push("Complete final payment");
        }
    }
    // 6. Car pickup - always show
    if (booking.actualPickupDate) {
        statusInfo.progress.carPickup = true;
        statusInfo.statusMessages.push("✅ Car pickup completed");
    }
    else {
        statusInfo.statusMessages.push("⏳ Car pickup pending");
        if (booking.otpVerified && booking.finalPaymentStatus === "paid") {
            statusInfo.nextSteps.push("Wait for PIC to confirm car pickup");
        }
    }
    // Determine current step and completion status
    if (!statusInfo.progress.advancePayment) {
        statusInfo.currentStep = "Advance Payment";
        statusInfo.canProceed = true;
    }
    else if (!booking.otpCode) {
        statusInfo.currentStep = "OTP Generation";
        statusInfo.canProceed = false;
    }
    else if (!statusInfo.progress.otpVerification) {
        statusInfo.currentStep = "OTP Verification";
        statusInfo.canProceed = true;
    }
    else if (!statusInfo.progress.userConfirmation) {
        statusInfo.currentStep = "User Confirmation";
        statusInfo.canProceed = true;
    }
    else if (!statusInfo.progress.picApproval) {
        statusInfo.currentStep = "PIC Approval";
        statusInfo.canProceed = false;
    }
    else if (!statusInfo.progress.finalPayment) {
        statusInfo.currentStep = "Final Payment";
        statusInfo.canProceed = true;
    }
    else if (!statusInfo.progress.carPickup) {
        statusInfo.currentStep = "Car Pickup (PIC Confirmation)";
        statusInfo.canProceed = false;
    }
    else {
        statusInfo.currentStep = "Completed";
        statusInfo.isCompleted = true;
    }
    // Add specific messages based on status (these are additional contextual messages)
    if (booking.confirmationStatus === "rejected" && booking.picComments) {
        statusInfo.statusMessages.push(`📝 PIC Comments: ${booking.picComments}`);
    }
    if (booking.otpCode && !booking.otpVerified) {
        statusInfo.statusMessages.push("🔐 OTP code generated and ready for verification");
    }
    else if (booking.advancePaymentStatus === "paid" && !booking.otpCode) {
        statusInfo.statusMessages.push("⏳ OTP generation pending");
    }
    return statusInfo;
};
exports.getUserBookingsWithStatus = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const result = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) => eq(bookingsTable.userId, userId),
        with: {
            car: {
                with: {
                    vendor: true,
                    parking: true,
                    catalog: true,
                },
            },
            pickupParking: true,
            dropoffParking: true,
        },
        orderBy: (bookingsTable, { desc }) => [desc(bookingsTable.createdAt)],
    });
    // Clean up tools data and add status summaries
    const bookingsWithStatus = result.map((booking) => {
        const cleanedBooking = {
            ...booking,
            tools: cleanToolsData(booking.tools),
        };
        const statusSummary = calculateBookingStatus(cleanedBooking);
        return {
            ...cleanedBooking,
            statusSummary,
        };
    });
    // Group bookings by status
    const groupedBookings = {
        active: bookingsWithStatus.filter((b) => b.status &&
            ["pending", "advance_paid", "confirmed", "active"].includes(b.status) &&
            !b.statusSummary.isCompleted),
        completed: bookingsWithStatus.filter((b) => b.status === "completed" || b.statusSummary.isCompleted),
        cancelled: bookingsWithStatus.filter((b) => b.status === "cancelled"),
    };
    return (0, responseHandler_1.sendSuccess)(res, {
        allBookings: bookingsWithStatus,
        groupedBookings,
        summary: {
            total: bookingsWithStatus.length,
            active: groupedBookings.active.length,
            completed: groupedBookings.completed.length,
            cancelled: groupedBookings.cancelled.length,
        },
    }, "User bookings with status retrieved successfully");
});
exports.confirmCarPickup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.body;
    const picId = req.user.id;
    if (!bookingId) {
        throw apiError_1.ApiError.badRequest("Booking ID is required");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
        with: {
            car: {
                with: {
                    parking: true,
                },
            },
        },
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    // Check if user is PIC (Parking In Charge)
    if (req.user.role !== "parkingincharge") {
        throw apiError_1.ApiError.forbidden("Only Parking In Charge can confirm car pickup");
    }
    // Check if PIC belongs to the parking lot where the car is located
    if (booking.car?.parking?.id !== req.user.parkingid) {
        throw apiError_1.ApiError.forbidden("You can only confirm pickup for cars in your assigned parking lot");
    }
    // Check if all prerequisites are met
    if (booking.advancePaymentStatus !== "paid") {
        throw apiError_1.ApiError.badRequest("Advance payment must be completed");
    }
    if (booking.finalPaymentStatus !== "paid") {
        throw apiError_1.ApiError.badRequest("Final payment must be completed");
    }
    if (!booking.otpVerified) {
        throw apiError_1.ApiError.badRequest("OTP must be verified before car pickup");
    }
    if (booking.confirmationStatus !== "approved") {
        throw apiError_1.ApiError.badRequest("Confirmation must be approved by PIC");
    }
    if (booking.actualPickupDate) {
        throw apiError_1.ApiError.conflict("Car has already been picked up");
    }
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        actualPickupDate: new Date(),
        status: "active", // Change status to active when car is picked up
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], "Car pickup confirmed successfully. The car has been taken from the parking lot.");
});
// Calculate late fees for overdue booking (auto-calculated based on car catalog)
exports.calculateLateFees = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(bookingId)),
        with: {
            car: {
                with: {
                    catalog: true,
                },
            },
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const booking = result;
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only calculate late fees for your own bookings");
    }
    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;
    let lateFees = 0;
    let overdueHours = 0;
    let hourlyRate = 0;
    if (isOverdue) {
        const diffInHours = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60));
        overdueHours = diffInHours;
        // Calculate hourly rate based on car catalog late fee rate
        const dailyRate = booking.basePrice || 0;
        const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1; // Default 10%
        hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
        lateFees = hourlyRate * diffInHours;
    }
    return (0, responseHandler_1.sendSuccess)(res, {
        bookingId: booking.id,
        isOverdue,
        overdueHours,
        lateFees: Math.round(lateFees * 100) / 100,
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        currentEndDate: booking.extensionTill || booking.endDate,
        carName: booking.car?.name || "Unknown",
        lateFeesPaid: booking.lateFeesPaid || false,
    }, "Late fees calculated successfully");
});
// Pay late fees for overdue booking
exports.payLateFees = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, paymentReferenceId } = req.body;
    if (!bookingId || !paymentReferenceId) {
        throw apiError_1.ApiError.badRequest("Booking ID and payment reference ID are required");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
        with: {
            car: {
                with: {
                    catalog: true,
                },
            },
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const booking = result;
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only pay late fees for your own bookings");
    }
    if (booking.lateFeesPaid) {
        throw apiError_1.ApiError.badRequest("Late fees have already been paid for this booking");
    }
    // Calculate current late fees
    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;
    if (!isOverdue) {
        throw apiError_1.ApiError.badRequest("No late fees to pay - booking is not overdue");
    }
    const diffInHours = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60));
    const dailyRate = booking.basePrice || 0;
    const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1;
    const hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
    const lateFees = hourlyRate * diffInHours;
    // Update booking with late fees payment
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        lateFees: Math.round(lateFees * 100) / 100,
        lateFeesPaid: true,
        lateFeesPaymentReferenceId: paymentReferenceId,
        lateFeesPaidAt: now,
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendSuccess)(res, {
        booking: updatedBooking[0],
        lateFees: Math.round(lateFees * 100) / 100,
        paymentReferenceId,
    }, "Late fees paid successfully");
});
// Confirm car return (PIC confirms car has been returned to parking lot)
exports.confirmCarReturn = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, returnCondition, returnImages, comments } = req.body;
    if (!bookingId) {
        throw apiError_1.ApiError.badRequest("Booking ID is required");
    }
    const booking = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
        with: {
            car: {
                with: {
                    parking: true,
                    catalog: true,
                },
            },
        },
    });
    if (!booking) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    // Check if user is PIC (Parking In Charge)
    if (req.user.role !== "parkingincharge") {
        throw apiError_1.ApiError.forbidden("Only Parking In Charge can confirm car return");
    }
    // Check if PIC belongs to the parking lot where the car is located
    if (booking.car?.parking?.id !== req.user.parkingid) {
        throw apiError_1.ApiError.forbidden("You can only confirm return for cars in your assigned parking lot");
    }
    // Check if all prerequisites are met
    if (booking.status !== "active") {
        throw apiError_1.ApiError.badRequest("Booking must be active to confirm return");
    }
    if (!booking.actualPickupDate) {
        throw apiError_1.ApiError.badRequest("Car must be picked up before it can be returned");
    }
    if (booking.actualDropoffDate) {
        throw apiError_1.ApiError.conflict("Car has already been returned");
    }
    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;
    // Check if late fees are paid (if overdue)
    if (isOverdue && !booking.lateFeesPaid) {
        throw apiError_1.ApiError.badRequest("Late fees must be paid before car can be returned");
    }
    // Calculate late fees if overdue and not already calculated
    let finalLateFees = booking.lateFees || 0;
    if (isOverdue && finalLateFees === 0) {
        const diffInHours = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60));
        const dailyRate = booking.basePrice || 0;
        const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1;
        const hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
        finalLateFees = hourlyRate * diffInHours;
    }
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        actualDropoffDate: now,
        status: "completed",
        returnCondition: returnCondition || "good",
        returnImages: returnImages || [],
        lateFees: Math.round(finalLateFees * 100) / 100,
        returnComments: comments || null,
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    const message = booking.lateFees && booking.lateFees > 0
        ? `Car return confirmed successfully. Late fees of ₹${booking.lateFees} have been applied.`
        : "Car return confirmed successfully.";
    return (0, responseHandler_1.sendUpdated)(res, updatedBooking[0], message);
});
// Get earnings overview (Admin only)
exports.getEarningsOverview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can view earnings overview");
    }
    // Use validated dates from request object (transformed by validation middleware)
    const startDate = req.startDate;
    const endDate = req.endDate;
    const start = startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();
    const result = await db_1.db.query.bookingsTable.findMany({
        where: (bookingsTable, { and, gte, lte, eq }) => and(eq(bookingsTable.status, "completed"), gte(bookingsTable.createdAt, start), lte(bookingsTable.createdAt, end)),
        with: {
            car: {
                with: {
                    catalog: true,
                },
            },
        },
    });
    let totalEarnings = 0;
    let totalAdvancePayments = 0;
    let totalFinalPayments = 0;
    let totalExtensionPayments = 0;
    let totalLateFees = 0;
    let totalDeliveryCharges = 0;
    result.forEach((booking) => {
        totalAdvancePayments += booking.advanceAmount || 0;
        totalFinalPayments += booking.remainingAmount || 0;
        totalExtensionPayments += booking.extensionPrice || 0;
        totalLateFees += booking.lateFees || 0;
        totalDeliveryCharges += booking.deliveryCharges || 0;
    });
    totalEarnings =
        totalAdvancePayments +
            totalFinalPayments +
            totalExtensionPayments +
            totalLateFees +
            totalDeliveryCharges;
    return (0, responseHandler_1.sendSuccess)(res, {
        period: {
            startDate: start,
            endDate: end,
        },
        summary: {
            totalBookings: result.length,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            totalAdvancePayments: Math.round(totalAdvancePayments * 100) / 100,
            totalFinalPayments: Math.round(totalFinalPayments * 100) / 100,
            totalExtensionPayments: Math.round(totalExtensionPayments * 100) / 100,
            totalLateFees: Math.round(totalLateFees * 100) / 100,
            totalDeliveryCharges: Math.round(totalDeliveryCharges * 100) / 100,
        },
        breakdown: result.map((booking) => ({
            bookingId: booking.id,
            carName: booking.car?.name || "Unknown",
            totalAmount: Math.round((booking.advanceAmount || 0) +
                (booking.remainingAmount || 0) +
                (booking.extensionPrice || 0) +
                (booking.lateFees || 0) +
                (booking.deliveryCharges || 0) * 100) / 100,
            advanceAmount: booking.advanceAmount || 0,
            finalAmount: booking.remainingAmount || 0,
            extensionAmount: booking.extensionPrice || 0,
            lateFees: booking.lateFees || 0,
            deliveryCharges: booking.deliveryCharges || 0,
            completedAt: booking.actualDropoffDate,
        })),
    }, "Earnings overview retrieved successfully");
});
// Check if booking is overdue and calculate late fees
exports.checkBookingOverdue = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(bookingId)),
        with: {
            car: {
                with: {
                    catalog: true,
                },
            },
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const booking = result;
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only check your own bookings");
    }
    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;
    let lateFees = 0;
    let overdueHours = 0;
    if (isOverdue) {
        const diffInHours = Math.ceil((now.getTime() - endDate.getTime()) / (1000 * 60 * 60));
        overdueHours = diffInHours;
        // Calculate late fees based on car catalog late fee rate
        const dailyRate = booking.basePrice || 0;
        const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1;
        const hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
        lateFees = hourlyRate * diffInHours;
    }
    return (0, responseHandler_1.sendSuccess)(res, {
        bookingId: booking.id,
        isOverdue,
        overdueHours,
        lateFees: Math.round(lateFees * 100) / 100,
        currentEndDate: booking.extensionTill || booking.endDate,
        extensionTill: booking.extensionTill,
        extensionTime: booking.extensionTime,
        extensionPrice: booking.extensionPrice,
        lateFeesPaid: booking.lateFeesPaid || false,
    }, "Booking overdue status checked successfully");
});
// Apply topup to extend booking
exports.applyTopupToBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, topupId, paymentReferenceId } = req.body;
    if (!bookingId || !topupId || !paymentReferenceId) {
        throw apiError_1.ApiError.badRequest("Booking ID, topup ID, and payment reference ID are required");
    }
    const result = await db_1.db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
        with: {
            car: true,
            user: true,
            pickupParking: true,
            dropoffParking: true,
        },
    });
    if (!result) {
        throw apiError_1.ApiError.notFound("Booking not found");
    }
    const booking = result;
    if (booking.userId !== req.user.id) {
        throw apiError_1.ApiError.forbidden("You can only apply topups to your own bookings");
    }
    // Check if booking is active
    if (booking.status !== "active") {
        throw apiError_1.ApiError.badRequest("Topups can only be applied to active bookings");
    }
    // Get topup details
    const topup = await db_1.db
        .select()
        .from(topupmodel_1.topupTable)
        .where((0, drizzle_orm_1.eq)(topupmodel_1.topupTable.id, topupId))
        .limit(1);
    if (!topup || topup.length === 0) {
        throw apiError_1.ApiError.notFound("Topup not found");
    }
    if (!topup[0].isActive) {
        throw apiError_1.ApiError.badRequest("This topup is not active");
    }
    // Calculate new end date
    const currentEndDate = booking.extensionTill || new Date(booking.endDate);
    const extensionTime = topup[0].duration; // in hours
    const newEndDate = new Date(currentEndDate.getTime() + extensionTime * 60 * 60 * 1000);
    // Create booking-topup relationship
    const bookingTopup = await db_1.db
        .insert(topupmodel_1.bookingTopupTable)
        .values({
        bookingId: bookingId,
        topupId: topupId,
        appliedAt: new Date(),
        originalEndDate: currentEndDate,
        newEndDate: newEndDate,
        amount: topup[0].price,
        paymentStatus: "paid",
        paymentReferenceId: paymentReferenceId,
    })
        .returning();
    // Update booking with new end date and extension details
    const updatedBooking = await db_1.db
        .update(bookingmodel_1.bookingsTable)
        .set({
        endDate: newEndDate,
        extensionPrice: (booking.extensionPrice || 0) + topup[0].price,
        extensionTill: newEndDate,
        extensionTime: (booking.extensionTime || 0) + extensionTime,
    })
        .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
        .returning();
    return (0, responseHandler_1.sendSuccess)(res, {
        bookingTopup: bookingTopup[0],
        updatedBooking: updatedBooking[0],
        topup: topup[0],
        newEndDate: newEndDate,
        extensionTime: extensionTime,
    }, "Topup applied successfully. Booking extended.");
});
// Get cars coming for pickup at PIC's parking lot (PIC only)
exports.getPickupCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        if (!req.user || req.user.role !== "parkingincharge") {
            throw apiError_1.ApiError.forbidden("Parking In Charge access required");
        }
        const { startDate, endDate, limit = 20, page = 1 } = req.query;
        // Parse and validate query parameters
        const limitNum = Math.min(parseInt(limit) || 20, 50);
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const offset = (pageNum - 1) * limitNum;
        // Build where conditions for pickup cars
        const conditions = [
            (0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.advancePaymentStatus, "paid"), // After advance payment
            (0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.status, "advance_paid"), // Status should be advance_paid
            // Note: We'll need to get the PIC's parking lot ID from their profile or a separate table
            // For now, we'll show all pickup cars and let the frontend filter by parking lot
        ];
        // Add date filtering if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw apiError_1.ApiError.badRequest("Invalid date format");
            }
            if (start >= end) {
                throw apiError_1.ApiError.badRequest("End date must be after start date");
            }
            // Filter by pickup date range - handle null pickupDate gracefully
            const pickupDateCondition = bookingmodel_1.bookingsTable.pickupDate
                ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(bookingmodel_1.bookingsTable.pickupDate, start), (0, drizzle_orm_1.lte)(bookingmodel_1.bookingsTable.pickupDate, end))
                : (0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(bookingmodel_1.bookingsTable.startDate, start), (0, drizzle_orm_1.lte)(bookingmodel_1.bookingsTable.startDate, end));
            if (pickupDateCondition) {
                conditions.push(pickupDateCondition);
            }
        }
        // Get total count
        const totalPickups = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(bookingmodel_1.bookingsTable)
            .where((0, drizzle_orm_1.and)(...conditions.filter(Boolean)));
        const total = totalPickups[0]?.count || 0;
        // Get pickup cars with pagination
        const pickupCars = await db_1.db
            .select({
            id: bookingmodel_1.bookingsTable.id,
            carId: bookingmodel_1.bookingsTable.carId,
            userId: bookingmodel_1.bookingsTable.userId,
            startDate: bookingmodel_1.bookingsTable.startDate,
            endDate: bookingmodel_1.bookingsTable.endDate,
            pickupDate: bookingmodel_1.bookingsTable.pickupDate,
            actualPickupDate: bookingmodel_1.bookingsTable.actualPickupDate,
            basePrice: bookingmodel_1.bookingsTable.basePrice,
            advanceAmount: bookingmodel_1.bookingsTable.advanceAmount,
            remainingAmount: bookingmodel_1.bookingsTable.remainingAmount,
            totalPrice: bookingmodel_1.bookingsTable.totalPrice,
            status: bookingmodel_1.bookingsTable.status,
            advancePaymentStatus: bookingmodel_1.bookingsTable.advancePaymentStatus,
            otpCode: bookingmodel_1.bookingsTable.otpCode,
            otpVerified: bookingmodel_1.bookingsTable.otpVerified,
            userConfirmed: bookingmodel_1.bookingsTable.userConfirmed,
            picApproved: bookingmodel_1.bookingsTable.picApproved,
            pickupParkingId: bookingmodel_1.bookingsTable.pickupParkingId,
            dropoffParkingId: bookingmodel_1.bookingsTable.dropoffParkingId,
            createdAt: bookingmodel_1.bookingsTable.createdAt,
            updatedAt: bookingmodel_1.bookingsTable.updatedAt,
        })
            .from(bookingmodel_1.bookingsTable)
            .where((0, drizzle_orm_1.and)(...conditions.filter(Boolean)))
            .limit(limitNum)
            .offset(offset)
            .orderBy((0, drizzle_orm_1.desc)(bookingmodel_1.bookingsTable.pickupDate || bookingmodel_1.bookingsTable.startDate));
        // Get additional details for each booking
        const enrichedPickupCars = await Promise.all(pickupCars.map(async (booking) => {
            // Get car details
            const car = await db_1.db
                .select({
                id: carmodel_1.carModel.id,
                name: carmodel_1.carModel.name,
                number: carmodel_1.carModel.number,
                color: carmodel_1.carModel.color,
                price: carmodel_1.carModel.price,
                images: carmodel_1.carModel.images,
                catalogId: carmodel_1.carModel.catalogId,
            })
                .from(carmodel_1.carModel)
                .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, booking.carId))
                .limit(1);
            // Get user details
            const user = await db_1.db
                .select({
                id: usermodel_1.UserTable.id,
                name: usermodel_1.UserTable.name,
                email: usermodel_1.UserTable.email,
                number: usermodel_1.UserTable.number,
            })
                .from(usermodel_1.UserTable)
                .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, booking.userId))
                .limit(1);
            // Get parking details
            const pickupParking = booking.pickupParkingId
                ? await db_1.db
                    .select({
                    id: parkingmodel_1.parkingTable.id,
                    name: parkingmodel_1.parkingTable.name,
                    locality: parkingmodel_1.parkingTable.locality,
                    city: parkingmodel_1.parkingTable.city,
                    state: parkingmodel_1.parkingTable.state,
                })
                    .from(parkingmodel_1.parkingTable)
                    .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, booking.pickupParkingId))
                    .limit(1)
                : null;
            const dropoffParking = booking.dropoffParkingId
                ? await db_1.db
                    .select({
                    id: parkingmodel_1.parkingTable.id,
                    name: parkingmodel_1.parkingTable.name,
                    locality: parkingmodel_1.parkingTable.locality,
                    city: parkingmodel_1.parkingTable.city,
                    state: parkingmodel_1.parkingTable.state,
                })
                    .from(parkingmodel_1.parkingTable)
                    .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, booking.dropoffParkingId))
                    .limit(1)
                : null;
            return {
                ...booking,
                car: car[0] || null,
                user: user[0] || null,
                pickupParking: pickupParking?.[0] || null,
                dropoffParking: dropoffParking?.[0] || null,
            };
        }));
        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        return (0, responseHandler_1.sendPaginated)(res, enrichedPickupCars, total, pageNum, limitNum, "Pickup cars fetched successfully");
    }
    catch (error) {
        console.log(error);
        throw new apiError_1.ApiError(500, "Failed to fetch pickup cars");
    }
});
// Get cars coming for dropoff at PIC's parking lot (PIC only)
exports.getDropoffCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        if (!req.user || req.user.role !== "parkingincharge") {
            throw apiError_1.ApiError.forbidden("Parking In Charge access required");
        }
        const { startDate, endDate, limit = 20, page = 1 } = req.query;
        // Parse and validate query parameters
        const limitNum = Math.min(parseInt(limit) || 20, 50);
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const offset = (pageNum - 1) * limitNum;
        // Build where conditions for dropoff cars
        const conditions = [
            (0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.status, "active"), // Active bookings
            (0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.finalPaymentStatus, "paid"), // Final payment completed
            // Note: We'll need to get the PIC's parking lot ID from their profile or a separate table
            // For now, we'll show all dropoff cars and let the frontend filter by parking lot
        ];
        // Add date filtering if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                throw apiError_1.ApiError.badRequest("Invalid date format");
            }
            if (start >= end) {
                throw apiError_1.ApiError.badRequest("End date must be after start date");
            }
            // Filter by dropoff date range (end date of booking)
            conditions.push((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(bookingmodel_1.bookingsTable.endDate, start), (0, drizzle_orm_1.lte)(bookingmodel_1.bookingsTable.endDate, end)));
        }
        // Get total count
        const totalDropoffs = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(bookingmodel_1.bookingsTable)
            .where((0, drizzle_orm_1.and)(...conditions.filter(Boolean)));
        const total = totalDropoffs[0]?.count || 0;
        // Get dropoff cars with pagination
        const dropoffCars = await db_1.db
            .select({
            id: bookingmodel_1.bookingsTable.id,
            carId: bookingmodel_1.bookingsTable.carId,
            userId: bookingmodel_1.bookingsTable.userId,
            startDate: bookingmodel_1.bookingsTable.startDate,
            endDate: bookingmodel_1.bookingsTable.endDate,
            actualPickupDate: bookingmodel_1.bookingsTable.actualPickupDate,
            actualDropoffDate: bookingmodel_1.bookingsTable.actualDropoffDate,
            basePrice: bookingmodel_1.bookingsTable.basePrice,
            advanceAmount: bookingmodel_1.bookingsTable.advanceAmount,
            remainingAmount: bookingmodel_1.bookingsTable.remainingAmount,
            totalPrice: bookingmodel_1.bookingsTable.totalPrice,
            status: bookingmodel_1.bookingsTable.status,
            finalPaymentStatus: bookingmodel_1.bookingsTable.finalPaymentStatus,
            extensionPrice: bookingmodel_1.bookingsTable.extensionPrice,
            extensionTill: bookingmodel_1.bookingsTable.extensionTill,
            lateFees: bookingmodel_1.bookingsTable.lateFees,
            lateFeesPaid: bookingmodel_1.bookingsTable.lateFeesPaid,
            returnCondition: bookingmodel_1.bookingsTable.returnCondition,
            returnComments: bookingmodel_1.bookingsTable.returnComments,
            pickupParkingId: bookingmodel_1.bookingsTable.pickupParkingId,
            dropoffParkingId: bookingmodel_1.bookingsTable.dropoffParkingId,
            createdAt: bookingmodel_1.bookingsTable.createdAt,
            updatedAt: bookingmodel_1.bookingsTable.updatedAt,
        })
            .from(bookingmodel_1.bookingsTable)
            .where((0, drizzle_orm_1.and)(...conditions.filter(Boolean)))
            .limit(limitNum)
            .offset(offset)
            .orderBy((0, drizzle_orm_1.desc)(bookingmodel_1.bookingsTable.endDate));
        // Get additional details for each booking
        const enrichedDropoffCars = await Promise.all(dropoffCars.map(async (booking) => {
            // Get car details
            const car = await db_1.db
                .select({
                id: carmodel_1.carModel.id,
                name: carmodel_1.carModel.name,
                number: carmodel_1.carModel.number,
                color: carmodel_1.carModel.color,
                price: carmodel_1.carModel.price,
                images: carmodel_1.carModel.images,
                catalogId: carmodel_1.carModel.catalogId,
            })
                .from(carmodel_1.carModel)
                .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, booking.carId))
                .limit(1);
            // Get user details
            const user = await db_1.db
                .select({
                id: usermodel_1.UserTable.id,
                name: usermodel_1.UserTable.name,
                email: usermodel_1.UserTable.email,
                number: usermodel_1.UserTable.number,
            })
                .from(usermodel_1.UserTable)
                .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, booking.userId))
                .limit(1);
            // Get parking details
            const pickupParking = booking.pickupParkingId
                ? await db_1.db
                    .select({
                    id: parkingmodel_1.parkingTable.id,
                    name: parkingmodel_1.parkingTable.name,
                    locality: parkingmodel_1.parkingTable.locality,
                    city: parkingmodel_1.parkingTable.city,
                    state: parkingmodel_1.parkingTable.state,
                })
                    .from(parkingmodel_1.parkingTable)
                    .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, booking.pickupParkingId))
                    .limit(1)
                : null;
            const dropoffParking = booking.dropoffParkingId
                ? await db_1.db
                    .select({
                    id: parkingmodel_1.parkingTable.id,
                    name: parkingmodel_1.parkingTable.name,
                    locality: parkingmodel_1.parkingTable.locality,
                    city: parkingmodel_1.parkingTable.city,
                    state: parkingmodel_1.parkingTable.state,
                })
                    .from(parkingmodel_1.parkingTable)
                    .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, booking.dropoffParkingId))
                    .limit(1)
                : null;
            return {
                ...booking,
                car: car[0] || null,
                user: user[0] || null,
                pickupParking: pickupParking?.[0] || null,
                dropoffParking: dropoffParking?.[0] || null,
            };
        }));
        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        return (0, responseHandler_1.sendPaginated)(res, enrichedDropoffCars, total, pageNum, limitNum, "Dropoff cars fetched successfully");
    }
    catch (error) {
        console.log(error);
        throw new apiError_1.ApiError(500, "Failed to fetch dropoff cars");
    }
});
//# sourceMappingURL=bookingcontroller.js.map