import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { bookingsTable } from "./bookingmodel";
import { asyncHandler } from "../utils/asyncHandler";
import { eq, between, and, gte, lte, sql, inArray, desc } from "drizzle-orm";
import { carModel } from "../car/carmodel";
import { parkingTable } from "../parking/parkingmodel";
import { ApiError } from "../utils/apiError";
import {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendItem,
  sendList,
} from "../utils/responseHandler";
import {
  generateOTP,
  getOTPExpirationTime,
  getOTPExpirationForPickup,
  shouldRegenerateOTP,
  verifyOTP,
} from "../utils/otpUtils";
import { UserTable } from "../user/usermodel";
import { topupTable, bookingTopupTable } from "./topupmodel";

// Extend the Request interface to include 'user' property
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    // add other user properties if needed
  };
}

// Helper function to clean up tools data
const cleanToolsData = (tools: any): any[] => {
  if (!tools || !Array.isArray(tools)) {
    return [];
  }

  // If tools is already in the correct format (array of objects), return as is
  if (tools.length > 0 && typeof tools[0] === "object" && tools[0] !== null) {
    return tools;
  }

  // If tools is in the old format (array of strings like "[object Object]"), return empty array
  if (
    tools.length > 0 &&
    typeof tools[0] === "string" &&
    tools[0].includes("[object Object]")
  ) {
    return [];
  }

  return tools;
};

export const createBooking = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { carId, startDate, endDate, deliveryCharges = 0 } = req.body;

    // Validate required fields
    if (!carId || !startDate || !endDate) {
      throw ApiError.badRequest(
        "Car ID, start date, and end date are required"
      );
    }

    // Validate dates
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw ApiError.badRequest("Invalid date format");
    }

    if (startDateObj >= endDateObj) {
      throw ApiError.badRequest("End date must be after start date");
    }

    // Get car details
    const carprice = await db
      .select()
      .from(carModel)
      .where(eq(carModel.id, carId));

    if (!carprice || carprice.length === 0) {
      throw ApiError.notFound("Car not found");
    }

    // Check if user is verified
    if ((req.user as any).isverified === false) {
      throw ApiError.forbidden(
        "Please login and verify your account to continue"
      );
    }

    // Check for overlapping bookings for the same car
    const overlappingBookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { eq, and, lte, gte }) =>
        and(
          eq(bookingsTable.carId, carId),
          lte(bookingsTable.startDate, endDateObj),
          gte(bookingsTable.endDate, startDateObj),
          // Only check active bookings (not cancelled)
          sql`${bookingsTable.status} NOT IN ('cancelled')`
        ),
    });

    if (overlappingBookings.length > 0) {
      throw ApiError.conflict("Car is already booked for the selected dates");
    }

    // Calculate pricing
    const days = Math.ceil(
      (endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)
    );
    const basePrice =
      (carprice[0]?.discountprice || carprice[0]?.price || 0) * days;
    const advancePercentage = 0.3; // 30% advance payment (configurable by admin)
    const advanceAmount = basePrice * advancePercentage;
    const remainingAmount = basePrice - advanceAmount;
    const totalPrice = basePrice + deliveryCharges;

    // Get car details to get parking ID
    const carDetails = await db
      .select({
        parkingId: carModel.parkingid,
      })
      .from(carModel)
      .where(eq(carModel.id, carId));

    if (!carDetails || carDetails.length === 0) {
      throw ApiError.notFound("Car not found");
    }

    const parkingId = carDetails[0].parkingId;

    const newBooking = await db
      .insert(bookingsTable)
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

    return sendCreated(res, newBooking[0], "Booking created successfully");
  }
);

export const getBookingByDateRange = asyncHandler(
  async (req: Request, res: Response) => {
    const { startDate, endDate } = req.body;

    // Validate input
    if (!startDate || !endDate) {
      throw ApiError.badRequest("Start date and end date are required");
    }

    // Convert string dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw ApiError.badRequest("Invalid date format");
    }

    const bookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { and, lte, gte }) =>
        and(
          lte(bookingsTable.startDate, endDateObj),
          gte(bookingsTable.endDate, startDateObj)
        ),
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

    return sendList(
      res,
      bookings,
      bookings.length,
      "Bookings fetched successfully"
    );
  }
);

export const getBookingByDateRangeByCarId = asyncHandler(
  async (req: Request, res: Response) => {
    const { startDate, endDate, carId } = req.body;

    // Validate input
    if (!startDate || !endDate || !carId) {
      throw ApiError.badRequest(
        "Start date, end date, and car ID are required"
      );
    }

    // Convert string dates to Date objects
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw ApiError.badRequest("Invalid date format");
    }

    const bookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { and, lte, gte, eq }) =>
        and(
          eq(bookingsTable.carId, carId),
          lte(bookingsTable.startDate, endDateObj),
          gte(bookingsTable.endDate, startDateObj)
        ),
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

    return sendList(
      res,
      bookings,
      bookings.length,
      "Bookings fetched successfully"
    );
  }
);

export const updatebooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    // Validate date formats if provided
    if (updateData.startDate) {
      const startDate = new Date(updateData.startDate);
      if (isNaN(startDate.getTime())) {
        throw ApiError.badRequest("Invalid startDate format");
      }
      updateData.startDate = startDate;
    }

    if (updateData.endDate) {
      const endDate = new Date(updateData.endDate);
      if (isNaN(endDate.getTime())) {
        throw ApiError.badRequest("Invalid endDate format");
      }
      updateData.endDate = endDate;
    }

    if (updateData.extensionTill) {
      const extensionTill = new Date(updateData.extensionTill);
      if (isNaN(extensionTill.getTime())) {
        throw ApiError.badRequest("Invalid extensionTill format");
      }
      updateData.extensionTill = extensionTill;
    }

    const booking = await db
      .update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, parseInt(id)))
      .returning();

    if (!booking || booking.length === 0) {
      throw ApiError.notFound("Booking not found");
    }

    return sendUpdated(res, booking[0], "Booking updated successfully");
  }
);

export const deletebooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    const booking = await db
      .delete(bookingsTable)
      .where(eq(bookingsTable.id, parseInt(id)))
      .returning();

    if (!booking || booking.length === 0) {
      throw ApiError.notFound("Booking not found");
    }

    return sendDeleted(res, "Booking deleted successfully");
  }
);

export const getbookingbyid = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    const booking = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(id)),
      with: {
        car: true,
        pickupParking: true,
        dropoffParking: true,
        user: true,
      },
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    // Clean up tools data
    const cleanedBooking = {
      ...booking,
      tools: cleanToolsData(booking.tools),
    };

    return sendItem(res, cleanedBooking, "Booking fetched successfully");
  }
);

export const getbookingbyuserid = asyncHandler(
  async (req: Request, res: Response) => {
    const { userid } = req.params;

    // Validate user ID
    if (!userid || !/^[0-9]+$/.test(userid)) {
      throw ApiError.badRequest("Invalid user ID");
    }

    const bookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.userId, parseInt(userid)),
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

    return sendList(
      res,
      cleanedBookings,
      cleanedBookings.length,
      "Bookings fetched successfully"
    );
  }
);

export const getbookingbycarid = asyncHandler(
  async (req: Request, res: Response) => {
    const { carid } = req.params;

    // Validate car ID
    if (!carid || !/^[0-9]+$/.test(carid)) {
      throw ApiError.badRequest("Invalid car ID");
    }

    const bookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.carId, parseInt(carid)),
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

    return sendList(
      res,
      cleanedBookings,
      cleanedBookings.length,
      "Bookings fetched successfully"
    );
  }
);

export const getbookingbypickupParkingId = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate parking ID
    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid parking ID");
    }

    const bookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.pickupParkingId, parseInt(id)),
      with: {
        car: true,
        pickupParking: true,
        dropoffParking: true,
        user: true,
      },
    });

    return sendList(
      res,
      bookings,
      bookings.length,
      "Bookings fetched successfully"
    );
  }
);

export const getbookingbydropoffParkingId = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate parking ID
    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid parking ID");
    }

    const bookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.dropoffParkingId, parseInt(id)),
      with: {
        car: true,
        pickupParking: true,
        dropoffParking: true,
        user: true,
      },
    });

    return sendList(
      res,
      bookings,
      bookings.length,
      "Bookings fetched successfully"
    );
  }
);

// New booking flow functions
export const confirmAdvancePayment = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, paymentReferenceId } = req.body;

    if (!bookingId || !paymentReferenceId) {
      throw ApiError.badRequest(
        "Booking ID and payment reference ID are required"
      );
    }

    const booking = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden(
        "You can only confirm payments for your own bookings"
      );
    }

    if (booking.advancePaymentStatus === "paid") {
      throw ApiError.conflict("Advance payment already confirmed");
    }

    // Generate OTP for user identification at pickup location
    const otpCode = generateOTP();
    const otpExpiresAt = getOTPExpirationForPickup(
      booking.pickupDate || booking.startDate
    );

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        advancePaymentStatus: "paid",
        advancePaymentReferenceId: paymentReferenceId,
        status: "advance_paid",
        otpCode: otpCode,
        otpExpiresAt: otpExpiresAt,
        otpVerified: false,
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendUpdated(
      res,
      updatedBooking[0],
      "Advance payment confirmed successfully. OTP generated for pickup verification."
    );
  }
);

export const submitConfirmationRequest = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, carConditionImages, tools, toolImages } = req.body;

    if (!bookingId) {
      throw ApiError.badRequest("Booking ID is required");
    }

    if (!carConditionImages || !Array.isArray(carConditionImages)) {
      throw ApiError.badRequest("Car condition images are required");
    }

    const booking = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden(
        "You can only submit confirmation requests for your own bookings"
      );
    }

    if (booking.advancePaymentStatus !== "paid") {
      throw ApiError.badRequest(
        "Advance payment must be completed before submitting confirmation request"
      );
    }

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        carConditionImages: carConditionImages,
        tools: tools || [],
        toolImages: toolImages || [],
        userConfirmed: true,
        userConfirmedAt: new Date(),
        confirmationStatus: "pending_approval",
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendUpdated(
      res,
      updatedBooking[0],
      "Confirmation request submitted successfully"
    );
  }
);

export const picApproveConfirmation = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, approved, comments } = req.body;

    if (!bookingId || approved === undefined) {
      throw ApiError.badRequest("Booking ID and approval status are required");
    }

    const booking = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    if (booking.confirmationStatus !== "pending_approval") {
      throw ApiError.badRequest("Booking is not pending approval");
    }

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        picApproved: approved,
        picApprovedAt: new Date(),
        picApprovedBy: req.user.id,
        picComments: comments || null,
        confirmationStatus: approved ? "approved" : "rejected",
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    const message = approved
      ? "Booking approved successfully"
      : "Booking rejected";
    return sendUpdated(res, updatedBooking[0], message);
  }
);

export const confirmFinalPayment = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, paymentReferenceId } = req.body;

    if (!bookingId || !paymentReferenceId) {
      throw ApiError.badRequest(
        "Booking ID and payment reference ID are required"
      );
    }

    const booking = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden(
        "You can only confirm payments for your own bookings"
      );
    }

    if (booking.confirmationStatus !== "approved") {
      throw ApiError.badRequest(
        "Booking must be approved before final payment"
      );
    }

    if (booking.finalPaymentStatus === "paid") {
      throw ApiError.conflict("Final payment already confirmed");
    }

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        finalPaymentStatus: "paid",
        finalPaymentReferenceId: paymentReferenceId,
        status: "confirmed",
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendUpdated(
      res,
      updatedBooking[0],
      "Final payment confirmed successfully"
    );
  }
);

export const getPICDashboard = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const picId = req.user.id;
    const picParkingId = (req.user as any).parkingid;

    if (!picParkingId) {
      throw ApiError.badRequest("PIC must be assigned to a parking lot");
    }

    // Get PIC's assigned parking lot details
    const parkingLot = await db
      .select()
      .from(parkingTable)
      .where(eq(parkingTable.id, picParkingId))
      .limit(1);

    // Get all cars in PIC's parking lot
    const cars = await db.query.carModel.findMany({
      where: (carModel, { eq }) => eq(carModel.parkingid, picParkingId),
      with: {
        vendor: true,
        parking: true,
        catalog: true,
      },
    });

    // Get all bookings for cars in PIC's parking lot
    const rawBookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { inArray }) =>
        cars.length > 0
          ? inArray(
              bookingsTable.carId,
              cars.map((car) => car.id)
            )
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
    const pendingOTPVerifications = bookings.filter(
      (booking) =>
        booking.status === "advance_paid" &&
        !booking.otpVerified &&
        booking.otpCode
    );

    // Get active bookings (confirmed and ongoing)
    const activeBookings = bookings.filter(
      (booking) =>
        booking.status && ["confirmed", "active"].includes(booking.status)
    );

    // Get completed bookings
    const completedBookings = bookings.filter(
      (booking) => booking.status === "completed"
    );

    // Get cancelled bookings
    const cancelledBookings = bookings.filter(
      (booking) => booking.status === "cancelled"
    );

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

    return sendSuccess(
      res,
      {
        parkingLot: parkingLot[0] || null,
        cars,
        bookings,
        pendingOTPVerifications,
        activeBookings,
        completedBookings,
        cancelledBookings,
        stats,
      },
      "PIC dashboard data retrieved successfully"
    );
  }
);

export const verifyBookingOTP = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, otp } = req.body;
    const picId = req.user.id;

    // Validate required fields
    if (!bookingId || !otp) {
      throw ApiError.badRequest("Booking ID and OTP are required");
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      with: {
        car: true,
        user: true,
        pickupParking: true,
        dropoffParking: true,
      },
    });

    if (!result) {
      throw ApiError.notFound("Booking not found");
    }

    const bookingData = result;

    // Check if user is PIC (Parking In Charge)
    if ((req.user as any).role !== "parkingincharge") {
      throw ApiError.forbidden("Only Parking In Charge can verify OTP");
    }

    // Get car details to find the parking lot
    const car = await db.query.carModel.findFirst({
      where: (carModel, { eq }) => eq(carModel.id, bookingData.carId),
      with: {
        vendor: true,
        parking: true,
        catalog: true,
      },
    });

    if (!car) {
      throw ApiError.notFound("Car not found");
    }

    const carData = car;

    // Check if PIC belongs to the parking lot where the car is located
    if (carData.parkingid !== (req.user as any).parkingid) {
      throw ApiError.forbidden(
        "You can only verify OTP for cars in your assigned parking lot"
      );
    }

    // Verify OTP
    verifyOTP(
      otp,
      bookingData.otpCode,
      bookingData.otpExpiresAt,
      bookingData.otpVerified || false
    );

    // Update booking with OTP verification
    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        otpVerified: true,
        otpVerifiedAt: new Date(),
        otpVerifiedBy: picId,
        status: "confirmed", // Change status to confirmed after OTP verification
        // Don't automatically set confirmationStatus to "approved" - this should be a separate step
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendUpdated(
      res,
      updatedBooking[0],
      "OTP verified successfully. User can now collect the car."
    );
  }
);

export const resendBookingOTP = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;

    // Validate required fields
    if (!bookingId) {
      throw ApiError.badRequest("Booking ID is required");
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      with: {
        car: true,
        user: true,
        pickupParking: true,
        dropoffParking: true,
      },
    });

    if (!result) {
      throw ApiError.notFound("Booking not found");
    }

    const bookingData = result;

    // Check if user owns this booking
    if (bookingData.userId !== req.user.id) {
      throw ApiError.forbidden("You can only resend OTP for your own bookings");
    }

    // Check if booking is in correct status
    if (bookingData.status !== "advance_paid") {
      throw ApiError.badRequest(
        "OTP can only be resent for bookings with advance payment completed"
      );
    }

    // Generate new OTP
    const newOTP = generateOTP();
    const newExpirationTime = getOTPExpirationTime();

    // Update booking with new OTP
    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        otpCode: newOTP,
        otpExpiresAt: newExpirationTime,
        otpVerified: false,
        otpVerifiedAt: null,
        otpVerifiedBy: null,
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendUpdated(
      res,
      updatedBooking[0],
      "New OTP generated successfully"
    );
  }
);

export const getBookingOTP = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;

    // Validate booking ID
    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.id, parseInt(bookingId)),
      with: {
        car: true,
        user: true,
        pickupParking: true,
        dropoffParking: true,
      },
    });

    if (!result) {
      throw ApiError.notFound("Booking not found");
    }

    const bookingData = result;

    // Check if user owns this booking
    if (bookingData.userId !== req.user.id) {
      throw ApiError.forbidden("You can only view OTP for your own bookings");
    }

    // Check if booking is in correct status
    if (bookingData.status !== "advance_paid") {
      throw ApiError.badRequest(
        "OTP is only available for bookings with advance payment completed"
      );
    }

    // Check if OTP is already verified
    if (bookingData.otpVerified) {
      throw ApiError.badRequest("OTP has already been verified");
    }

    // Check if OTP is expired
    if (bookingData.otpExpiresAt && bookingData.otpExpiresAt < new Date()) {
      throw ApiError.badRequest("OTP has expired. Please request a new one");
    }

    return sendItem(
      res,
      {
        bookingId: bookingData.id,
        otp: bookingData.otpCode,
        expiresAt: bookingData.otpExpiresAt,
        isVerified: bookingData.otpVerified,
      },
      "OTP retrieved successfully"
    );
  }
);

export const rescheduleBooking = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;
    const { newPickupDate, newStartDate, newEndDate } = req.body;

    // Validate required fields
    if (!newPickupDate) {
      throw ApiError.badRequest("New pickup date is required");
    }

    // Validate pickup date
    const newPickupDateObj = new Date(newPickupDate);
    if (isNaN(newPickupDateObj.getTime())) {
      throw ApiError.badRequest("Invalid pickup date format");
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.id, parseInt(bookingId)),
      with: {
        car: true,
        user: true,
        pickupParking: true,
        dropoffParking: true,
      },
    });

    if (!result) {
      throw ApiError.notFound("Booking not found");
    }

    const bookingData = result;

    // Check if user owns this booking
    if (bookingData.userId !== req.user.id) {
      throw ApiError.forbidden("You can only reschedule your own bookings");
    }

    // Check if booking can be rescheduled
    if (
      bookingData.status === "completed" ||
      bookingData.status === "cancelled"
    ) {
      throw ApiError.badRequest(
        "Cannot reschedule completed or cancelled bookings"
      );
    }

    // Check reschedule limit
    if (
      (bookingData.rescheduleCount || 0) >=
      (bookingData.maxRescheduleCount || 3)
    ) {
      throw ApiError.badRequest(
        `Maximum reschedule limit (${
          bookingData.maxRescheduleCount || 3
        }) reached`
      );
    }

    // Check if new pickup date is in the future
    if (newPickupDateObj <= new Date()) {
      throw ApiError.badRequest("Pickup date must be in the future");
    }

    // Check for car availability on new dates
    const newStartDateObj = newStartDate
      ? new Date(newStartDate)
      : bookingData.startDate;
    const newEndDateObj = newEndDate
      ? new Date(newEndDate)
      : bookingData.endDate;

    if (newStartDateObj >= newEndDateObj) {
      throw ApiError.badRequest("End date must be after start date");
    }

    // Check for overlapping bookings
    const overlappingBookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { eq, and, lte, gte, ne }) =>
        and(
          eq(bookingsTable.carId, bookingData.carId),
          ne(bookingsTable.id, parseInt(bookingId)), // Exclude current booking
          lte(bookingsTable.startDate, newEndDateObj),
          gte(bookingsTable.endDate, newStartDateObj),
          sql`${bookingsTable.status} NOT IN ('cancelled')`
        ),
    });

    if (overlappingBookings.length > 0) {
      throw ApiError.conflict("Car is already booked for the selected dates");
    }

    // Store original pickup date if this is the first reschedule
    const originalPickupDate =
      bookingData.originalPickupDate || bookingData.pickupDate;

    // Check if OTP needs to be regenerated
    const shouldRegenerate = shouldRegenerateOTP(
      bookingData.otpExpiresAt,
      newPickupDateObj
    );

    // Prepare update data
    const updateData: any = {
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
      updateData.otpCode = generateOTP();
      updateData.otpExpiresAt = getOTPExpirationForPickup(newPickupDateObj);
      updateData.otpVerified = false;
      updateData.otpVerifiedAt = null;
      updateData.otpVerifiedBy = null;
    }

    // Update booking
    const updatedBooking = await db
      .update(bookingsTable)
      .set(updateData)
      .where(eq(bookingsTable.id, parseInt(bookingId)))
      .returning();

    const message = shouldRegenerate
      ? "Booking rescheduled successfully. New OTP has been generated."
      : "Booking rescheduled successfully.";

    return sendUpdated(res, updatedBooking[0], message);
  }
);

export const getPICByEntity = asyncHandler(
  async (req: Request, res: Response) => {
    const { carId, bookingId, parkingId } = req.query;

    // Validate that at least one parameter is provided
    if (!carId && !bookingId && !parkingId) {
      throw ApiError.badRequest(
        "Please provide either carId, bookingId, or parkingId"
      );
    }

    let targetParkingId: number | null = null;

    // Determine parking ID based on input
    if (parkingId) {
      // Direct parking ID provided
      targetParkingId = Number(parkingId);
    } else if (carId) {
      // Get parking ID from car
      const car = await db.query.carModel.findFirst({
        where: (carModel, { eq }) => eq(carModel.id, Number(carId)),
        with: {
          vendor: true,
          parking: true,
          catalog: true,
        },
      });

      if (!car) {
        throw ApiError.notFound("Car not found");
      }
      targetParkingId = car.parkingid;
    } else if (bookingId) {
      // Get parking ID from booking's car
      const booking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) =>
          eq(bookingsTable.id, Number(bookingId)),
        with: {
          car: true,
          pickupParking: true,
          dropoffParking: true,
        },
      });

      if (!booking) {
        throw ApiError.notFound("Booking not found");
      }

      const car = await db.query.carModel.findFirst({
        where: (carModel, { eq }) => eq(carModel.id, booking.carId),
        with: {
          vendor: true,
          parking: true,
          catalog: true,
        },
      });

      if (!car) {
        throw ApiError.notFound("Car not found for this booking");
      }
      targetParkingId = car.parkingid;
    }

    if (!targetParkingId) {
      throw ApiError.notFound("Could not determine parking lot");
    }

    // Get PIC assigned to this parking lot
    const pic = await db
      .select({
        id: UserTable.id,
        name: UserTable.name,
        email: UserTable.email,
        number: UserTable.number,
        role: UserTable.role,
        parkingid: UserTable.parkingid,
        isverified: UserTable.isverified,
        createdAt: UserTable.createdAt,
      })
      .from(UserTable)
      .where(
        and(
          eq(UserTable.role, "parkingincharge"),
          eq(UserTable.parkingid, targetParkingId)
        )
      )
      .limit(1);

    if (!pic || pic.length === 0) {
      throw ApiError.notFound(
        "No Parking In Charge assigned to this parking lot"
      );
    }

    // Get parking lot details
    const parkingLot = await db
      .select()
      .from(parkingTable)
      .where(eq(parkingTable.id, targetParkingId))
      .limit(1);

    return sendItem(
      res,
      {
        pic: pic[0],
        parkingLot: parkingLot[0] || null,
        source: {
          carId: carId || null,
          bookingId: bookingId || null,
          parkingId: parkingId || null,
        },
      },
      "PIC information retrieved successfully"
    );
  }
);

export const getPICConfirmationRequests = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const picId = req.user.id;
    const picParkingId = (req.user as any).parkingid;

    if (!picParkingId) {
      throw ApiError.badRequest("PIC must be assigned to a parking lot");
    }

    // Get all cars in PIC's parking lot
    const cars = await db.query.carModel.findMany({
      where: (carModel, { eq }) => eq(carModel.parkingid, picParkingId),
      with: {
        vendor: true,
        parking: true,
        catalog: true,
      },
    });

    if (cars.length === 0) {
      return sendSuccess(
        res,
        {
          confirmationRequests: [],
          stats: {
            totalRequests: 0,
            pendingApproval: 0,
            approved: 0,
            rejected: 0,
          },
        },
        "Confirmation requests retrieved successfully"
      );
    }

    // Get all bookings for cars in PIC's parking lot that have confirmation requests
    const rawBookings = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { and, inArray, eq }) =>
        and(
          inArray(
            bookingsTable.carId,
            cars.map((car) => car.id)
          ),
          eq(bookingsTable.confirmationStatus, "pending_approval")
        ),
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
      pendingApproval: bookings.filter(
        (booking) => booking.confirmationStatus === "pending_approval"
      ).length,
      approved: bookings.filter(
        (booking) => booking.confirmationStatus === "approved"
      ).length,
      rejected: bookings.filter(
        (booking) => booking.confirmationStatus === "rejected"
      ).length,
    };

    return sendSuccess(
      res,
      {
        confirmationRequests: bookings,
        stats,
      },
      "Confirmation requests retrieved successfully"
    );
  }
);

export const resubmitConfirmationRequest = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      bookingId,
      carConditionImages,
      tools,
      toolImages,
      resubmissionReason,
    } = req.body;

    if (!bookingId) {
      throw ApiError.badRequest("Booking ID is required");
    }

    if (!carConditionImages || !Array.isArray(carConditionImages)) {
      throw ApiError.badRequest("Car condition images are required");
    }

    const booking = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden(
        "You can only resubmit confirmation requests for your own bookings"
      );
    }

    // Check if booking was previously rejected
    if (booking.confirmationStatus !== "rejected") {
      throw ApiError.badRequest(
        "Only rejected confirmation requests can be resubmitted"
      );
    }

    // Check if advance payment is completed
    if (booking.advancePaymentStatus !== "paid") {
      throw ApiError.badRequest(
        "Advance payment must be completed before resubmitting confirmation request"
      );
    }

    const updatedBooking = await db
      .update(bookingsTable)
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
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendUpdated(
      res,
      updatedBooking[0],
      "Confirmation request resubmitted successfully"
    );
  }
);

export const getUserRejectedConfirmations = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;

    const result = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { and, eq }) =>
        and(
          eq(bookingsTable.userId, userId),
          eq(bookingsTable.confirmationStatus, "rejected")
        ),
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

    return sendSuccess(
      res,
      {
        rejectedConfirmations: cleanedBookings,
        totalRejected: cleanedBookings.length,
      },
      "Rejected confirmation requests retrieved successfully"
    );
  }
);

export const getBookingStatus = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;

    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.id, parseInt(bookingId)),
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
      throw ApiError.notFound("Booking not found");
    }

    const booking = result;

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden("You can only view your own booking status");
    }

    // Clean up tools data
    const cleanedBooking = {
      ...booking,
      tools: cleanToolsData(booking.tools),
    };

    // Calculate booking progress and status
    const statusInfo = calculateBookingStatus(cleanedBooking);

    return sendSuccess(
      res,
      {
        booking: cleanedBooking,
        statusInfo,
      },
      "Booking status retrieved successfully"
    );
  }
);

// Helper function to calculate comprehensive booking status
const calculateBookingStatus = (booking: any) => {
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
    nextSteps: [] as string[],
    currentStep: "",
    isCompleted: false,
    canProceed: false,

    // Status messages (now always includes all steps)
    statusMessages: [] as string[],
  };

  // 1. Advance payment - always show
  if (booking.advancePaymentStatus === "paid") {
    statusInfo.progress.advancePayment = true;
    statusInfo.statusMessages.push("✅ Advance payment completed");
  } else {
    statusInfo.nextSteps.push("Complete advance payment to proceed");
    statusInfo.statusMessages.push("⏳ Advance payment pending");
  }

  // 2. OTP verification - always show
  if (booking.otpVerified) {
    statusInfo.progress.otpVerification = true;
    statusInfo.statusMessages.push("✅ OTP verified");
  } else {
    statusInfo.statusMessages.push("⏳ OTP verification pending");
    if (booking.otpCode && booking.advancePaymentStatus === "paid") {
      statusInfo.nextSteps.push("Verify OTP at pickup location");
    }
  }

  // 3. User confirmation - always show
  if (booking.userConfirmed) {
    statusInfo.progress.userConfirmation = true;
    statusInfo.statusMessages.push("✅ User confirmation submitted");
  } else {
    statusInfo.statusMessages.push("⏳ User confirmation pending");
    if (booking.otpVerified && booking.advancePaymentStatus === "paid") {
      statusInfo.nextSteps.push("Submit car condition confirmation");
    }
  }

  // 4. PIC approval - always show
  if (booking.userConfirmed && booking.confirmationStatus === "approved") {
    statusInfo.progress.picApproval = true;
    statusInfo.statusMessages.push("✅ PIC approval completed");
  } else if (
    booking.userConfirmed &&
    booking.confirmationStatus === "rejected"
  ) {
    statusInfo.nextSteps.push("Resubmit confirmation request");
    statusInfo.statusMessages.push("❌ Confirmation rejected by PIC");
  } else if (
    booking.userConfirmed &&
    booking.confirmationStatus === "pending_approval"
  ) {
    statusInfo.nextSteps.push("Wait for PIC approval");
    statusInfo.statusMessages.push("⏳ PIC approval pending");
  } else {
    // User hasn't confirmed yet, so PIC approval is not applicable yet
    statusInfo.statusMessages.push("⏳ PIC approval pending");
  }

  // 5. Final payment - always show
  if (booking.finalPaymentStatus === "paid") {
    statusInfo.progress.finalPayment = true;
    statusInfo.statusMessages.push("✅ Final payment completed");
  } else {
    statusInfo.statusMessages.push("⏳ Final payment pending");
    if (booking.userConfirmed && booking.confirmationStatus === "approved") {
      statusInfo.nextSteps.push("Complete final payment");
    }
  }

  // 6. Car pickup - always show
  if (booking.actualPickupDate) {
    statusInfo.progress.carPickup = true;
    statusInfo.statusMessages.push("✅ Car pickup completed");
  } else {
    statusInfo.statusMessages.push("⏳ Car pickup pending");
    if (booking.otpVerified && booking.finalPaymentStatus === "paid") {
      statusInfo.nextSteps.push("Wait for PIC to confirm car pickup");
    }
  }

  // Determine current step and completion status
  if (!statusInfo.progress.advancePayment) {
    statusInfo.currentStep = "Advance Payment";
    statusInfo.canProceed = true;
  } else if (!booking.otpCode) {
    statusInfo.currentStep = "OTP Generation";
    statusInfo.canProceed = false;
  } else if (!statusInfo.progress.otpVerification) {
    statusInfo.currentStep = "OTP Verification";
    statusInfo.canProceed = true;
  } else if (!statusInfo.progress.userConfirmation) {
    statusInfo.currentStep = "User Confirmation";
    statusInfo.canProceed = true;
  } else if (!statusInfo.progress.picApproval) {
    statusInfo.currentStep = "PIC Approval";
    statusInfo.canProceed = false;
  } else if (!statusInfo.progress.finalPayment) {
    statusInfo.currentStep = "Final Payment";
    statusInfo.canProceed = true;
  } else if (!statusInfo.progress.carPickup) {
    statusInfo.currentStep = "Car Pickup (PIC Confirmation)";
    statusInfo.canProceed = false;
  } else {
    statusInfo.currentStep = "Completed";
    statusInfo.isCompleted = true;
  }

  // Add specific messages based on status (these are additional contextual messages)
  if (booking.confirmationStatus === "rejected" && booking.picComments) {
    statusInfo.statusMessages.push(`📝 PIC Comments: ${booking.picComments}`);
  }

  if (booking.otpCode && !booking.otpVerified) {
    statusInfo.statusMessages.push(
      "🔐 OTP code generated and ready for verification"
    );
  } else if (booking.advancePaymentStatus === "paid" && !booking.otpCode) {
    statusInfo.statusMessages.push("⏳ OTP generation pending");
  }

  return statusInfo;
};

export const getUserBookingsWithStatus = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user.id;

    const result = await db.query.bookingsTable.findMany({
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
      active: bookingsWithStatus.filter(
        (b) =>
          b.status &&
          ["pending", "advance_paid", "confirmed", "active"].includes(
            b.status
          ) &&
          !b.statusSummary.isCompleted
      ),
      completed: bookingsWithStatus.filter(
        (b) => b.status === "completed" || b.statusSummary.isCompleted
      ),
      cancelled: bookingsWithStatus.filter((b) => b.status === "cancelled"),
    };

    return sendSuccess(
      res,
      {
        allBookings: bookingsWithStatus,
        groupedBookings,
        summary: {
          total: bookingsWithStatus.length,
          active: groupedBookings.active.length,
          completed: groupedBookings.completed.length,
          cancelled: groupedBookings.cancelled.length,
        },
      },
      "User bookings with status retrieved successfully"
    );
  }
);

export const confirmCarPickup = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;
    const picId = req.user.id;

    if (!bookingId) {
      throw ApiError.badRequest("Booking ID is required");
    }

    const booking = await db.query.bookingsTable.findFirst({
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
      throw ApiError.notFound("Booking not found");
    }

    // Check if user is PIC (Parking In Charge)
    if ((req.user as any).role !== "parkingincharge") {
      throw ApiError.forbidden("Only Parking In Charge can confirm car pickup");
    }

    // Check if PIC belongs to the parking lot where the car is located
    if (booking.car?.parking?.id !== (req.user as any).parkingid) {
      throw ApiError.forbidden(
        "You can only confirm pickup for cars in your assigned parking lot"
      );
    }

    // Check if all prerequisites are met
    if (booking.advancePaymentStatus !== "paid") {
      throw ApiError.badRequest("Advance payment must be completed");
    }

    if (booking.finalPaymentStatus !== "paid") {
      throw ApiError.badRequest("Final payment must be completed");
    }

    if (!booking.otpVerified) {
      throw ApiError.badRequest("OTP must be verified before car pickup");
    }

    if (booking.confirmationStatus !== "approved") {
      throw ApiError.badRequest("Confirmation must be approved by PIC");
    }

    if (booking.actualPickupDate) {
      throw ApiError.conflict("Car has already been picked up");
    }

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        actualPickupDate: new Date(),
        status: "active", // Change status to active when car is picked up
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendUpdated(
      res,
      updatedBooking[0],
      "Car pickup confirmed successfully. The car has been taken from the parking lot."
    );
  }
);

// Calculate late fees for overdue booking (auto-calculated based on car catalog)
export const calculateLateFees = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;

    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.id, parseInt(bookingId)),
      with: {
        car: {
          with: {
            catalog: true,
          },
        },
      },
    });

    if (!result) {
      throw ApiError.notFound("Booking not found");
    }

    const booking = result;

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden(
        "You can only calculate late fees for your own bookings"
      );
    }

    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;

    let lateFees = 0;
    let overdueHours = 0;
    let hourlyRate = 0;

    if (isOverdue) {
      const diffInHours = Math.ceil(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60)
      );
      overdueHours = diffInHours;

      // Calculate hourly rate based on car catalog late fee rate
      const dailyRate = booking.basePrice || 0;
      const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1; // Default 10%
      hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
      lateFees = hourlyRate * diffInHours;
    }

    return sendSuccess(
      res,
      {
        bookingId: booking.id,
        isOverdue,
        overdueHours,
        lateFees: Math.round(lateFees * 100) / 100,
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        currentEndDate: booking.extensionTill || booking.endDate,
        carName: booking.car?.name || "Unknown",
        lateFeesPaid: booking.lateFeesPaid || false,
      },
      "Late fees calculated successfully"
    );
  }
);

// Pay late fees for overdue booking
export const payLateFees = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, paymentReferenceId } = req.body;

    if (!bookingId || !paymentReferenceId) {
      throw ApiError.badRequest(
        "Booking ID and payment reference ID are required"
      );
    }

    const result = await db.query.bookingsTable.findFirst({
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
      throw ApiError.notFound("Booking not found");
    }

    const booking = result;

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden(
        "You can only pay late fees for your own bookings"
      );
    }

    if (booking.lateFeesPaid) {
      throw ApiError.badRequest(
        "Late fees have already been paid for this booking"
      );
    }

    // Calculate current late fees
    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;

    if (!isOverdue) {
      throw ApiError.badRequest("No late fees to pay - booking is not overdue");
    }

    const diffInHours = Math.ceil(
      (now.getTime() - endDate.getTime()) / (1000 * 60 * 60)
    );
    const dailyRate = booking.basePrice || 0;
    const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1;
    const hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
    const lateFees = hourlyRate * diffInHours;

    // Update booking with late fees payment
    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        lateFees: Math.round(lateFees * 100) / 100,
        lateFeesPaid: true,
        lateFeesPaymentReferenceId: paymentReferenceId,
        lateFeesPaidAt: now,
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendSuccess(
      res,
      {
        booking: updatedBooking[0],
        lateFees: Math.round(lateFees * 100) / 100,
        paymentReferenceId,
      },
      "Late fees paid successfully"
    );
  }
);

// Confirm car return (PIC confirms car has been returned to parking lot)
export const confirmCarReturn = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, returnCondition, returnImages, comments } = req.body;

    if (!bookingId) {
      throw ApiError.badRequest("Booking ID is required");
    }

    const booking = await db.query.bookingsTable.findFirst({
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
      throw ApiError.notFound("Booking not found");
    }

    // Check if user is PIC (Parking In Charge)
    if ((req.user as any).role !== "parkingincharge") {
      throw ApiError.forbidden("Only Parking In Charge can confirm car return");
    }

    // Check if PIC belongs to the parking lot where the car is located
    if (booking.car?.parking?.id !== (req.user as any).parkingid) {
      throw ApiError.forbidden(
        "You can only confirm return for cars in your assigned parking lot"
      );
    }

    // Check if all prerequisites are met
    if (booking.status !== "active") {
      throw ApiError.badRequest("Booking must be active to confirm return");
    }

    if (!booking.actualPickupDate) {
      throw ApiError.badRequest(
        "Car must be picked up before it can be returned"
      );
    }

    if (booking.actualDropoffDate) {
      throw ApiError.conflict("Car has already been returned");
    }

    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;

    // Check if late fees are paid (if overdue)
    if (isOverdue && !booking.lateFeesPaid) {
      throw ApiError.badRequest(
        "Late fees must be paid before car can be returned"
      );
    }

    // Calculate late fees if overdue and not already calculated
    let finalLateFees = booking.lateFees || 0;
    if (isOverdue && finalLateFees === 0) {
      const diffInHours = Math.ceil(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60)
      );
      const dailyRate = booking.basePrice || 0;
      const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1;
      const hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
      finalLateFees = hourlyRate * diffInHours;
    }

    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        actualDropoffDate: now,
        status: "completed",
        returnCondition: returnCondition || "good",
        returnImages: returnImages || [],
        lateFees: Math.round(finalLateFees * 100) / 100,
        returnComments: comments || null,
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    const message =
      booking.lateFees && booking.lateFees > 0
        ? `Car return confirmed successfully. Late fees of ₹${booking.lateFees} have been applied.`
        : "Car return confirmed successfully.";

    return sendUpdated(res, updatedBooking[0], message);
  }
);

// Get earnings overview (Admin only)
export const getEarningsOverview = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    if ((req.user as any).role !== "admin") {
      throw ApiError.forbidden("Only admins can view earnings overview");
    }

    // Use validated dates from request object (transformed by validation middleware)
    const startDate = (req as any).startDate;
    const endDate = (req as any).endDate;

    const start =
      startDate || new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate || new Date();

    const result = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { and, gte, lte, eq }) =>
        and(
          eq(bookingsTable.status, "completed"),
          gte(bookingsTable.createdAt, start),
          lte(bookingsTable.createdAt, end)
        ),
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

    return sendSuccess(
      res,
      {
        period: {
          startDate: start,
          endDate: end,
        },
        summary: {
          totalBookings: result.length,
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalAdvancePayments: Math.round(totalAdvancePayments * 100) / 100,
          totalFinalPayments: Math.round(totalFinalPayments * 100) / 100,
          totalExtensionPayments:
            Math.round(totalExtensionPayments * 100) / 100,
          totalLateFees: Math.round(totalLateFees * 100) / 100,
          totalDeliveryCharges: Math.round(totalDeliveryCharges * 100) / 100,
        },
        breakdown: result.map((booking) => ({
          bookingId: booking.id,
          carName: booking.car?.name || "Unknown",
          totalAmount:
            Math.round(
              (booking.advanceAmount || 0) +
                (booking.remainingAmount || 0) +
                (booking.extensionPrice || 0) +
                (booking.lateFees || 0) +
                (booking.deliveryCharges || 0) * 100
            ) / 100,
          advanceAmount: booking.advanceAmount || 0,
          finalAmount: booking.remainingAmount || 0,
          extensionAmount: booking.extensionPrice || 0,
          lateFees: booking.lateFees || 0,
          deliveryCharges: booking.deliveryCharges || 0,
          completedAt: booking.actualDropoffDate,
        })),
      },
      "Earnings overview retrieved successfully"
    );
  }
);

// Check if booking is overdue and calculate late fees
export const checkBookingOverdue = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.params;

    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) =>
        eq(bookingsTable.id, parseInt(bookingId)),
      with: {
        car: {
          with: {
            catalog: true,
          },
        },
      },
    });

    if (!result) {
      throw ApiError.notFound("Booking not found");
    }

    const booking = result;

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden("You can only check your own bookings");
    }

    const now = new Date();
    const endDate = new Date(booking.extensionTill || booking.endDate);
    const isOverdue = now > endDate;

    let lateFees = 0;
    let overdueHours = 0;

    if (isOverdue) {
      const diffInHours = Math.ceil(
        (now.getTime() - endDate.getTime()) / (1000 * 60 * 60)
      );
      overdueHours = diffInHours;

      // Calculate late fees based on car catalog late fee rate
      const dailyRate = booking.basePrice || 0;
      const lateFeeRate = booking.car?.catalog?.lateFeeRate || 0.1;
      const hourlyRate = (dailyRate / 24) * parseFloat(lateFeeRate.toString());
      lateFees = hourlyRate * diffInHours;
    }

    return sendSuccess(
      res,
      {
        bookingId: booking.id,
        isOverdue,
        overdueHours,
        lateFees: Math.round(lateFees * 100) / 100,
        currentEndDate: booking.extensionTill || booking.endDate,
        extensionTill: booking.extensionTill,
        extensionTime: booking.extensionTime,
        extensionPrice: booking.extensionPrice,
        lateFeesPaid: booking.lateFeesPaid || false,
      },
      "Booking overdue status checked successfully"
    );
  }
);

// Apply topup to extend booking
export const applyTopupToBooking = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, topupId, paymentReferenceId } = req.body;

    if (!bookingId || !topupId || !paymentReferenceId) {
      throw ApiError.badRequest(
        "Booking ID, topup ID, and payment reference ID are required"
      );
    }

    const result = await db.query.bookingsTable.findFirst({
      where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      with: {
        car: true,
        user: true,
        pickupParking: true,
        dropoffParking: true,
      },
    });

    if (!result) {
      throw ApiError.notFound("Booking not found");
    }

    const booking = result;

    if (booking.userId !== req.user.id) {
      throw ApiError.forbidden(
        "You can only apply topups to your own bookings"
      );
    }

    // Check if booking is active
    if (booking.status !== "active") {
      throw ApiError.badRequest(
        "Topups can only be applied to active bookings"
      );
    }

    // Get topup details
    const topup = await db
      .select()
      .from(topupTable)
      .where(eq(topupTable.id, topupId))
      .limit(1);

    if (!topup || topup.length === 0) {
      throw ApiError.notFound("Topup not found");
    }

    if (!topup[0].isActive) {
      throw ApiError.badRequest("This topup is not active");
    }

    // Calculate new end date
    const currentEndDate = booking.extensionTill || new Date(booking.endDate);
    const extensionTime = topup[0].duration; // in hours
    const newEndDate = new Date(
      currentEndDate.getTime() + extensionTime * 60 * 60 * 1000
    );

    // Create booking-topup relationship
    const bookingTopup = await db
      .insert(bookingTopupTable)
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
    const updatedBooking = await db
      .update(bookingsTable)
      .set({
        endDate: newEndDate,
        extensionPrice: (booking.extensionPrice || 0) + topup[0].price,
        extensionTill: newEndDate,
        extensionTime: (booking.extensionTime || 0) + extensionTime,
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    return sendSuccess(
      res,
      {
        bookingTopup: bookingTopup[0],
        updatedBooking: updatedBooking[0],
        topup: topup[0],
        newEndDate: newEndDate,
        extensionTime: extensionTime,
      },
      "Topup applied successfully. Booking extended."
    );
  }
);
