import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { bookingsTable } from "./bookingmodel";
import { asyncHandler } from "../utils/asyncHandler";
import { eq, between, and, gte, lte, sql } from "drizzle-orm";
import { carModel } from "../car/carmodel";
import { ApiError } from "../utils/apiError";
import {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendItem,
  sendList,
} from "../utils/responseHandler";
import { withDatabaseErrorHandling } from "../utils/dbErrorHandler";

// Extend the Request interface to include 'user' property
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    // add other user properties if needed
  };
}

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

    const booking = await withDatabaseErrorHandling(async () => {
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

      const newBooking = await db
        .insert(bookingsTable)
        .values({
          ...req.body,
          userId: Number(req.user.id),
          basePrice: basePrice,
          advanceAmount: advanceAmount,
          remainingAmount: remainingAmount,
          totalPrice: totalPrice,
          startDate: startDateObj,
          endDate: endDateObj,
          status: "pending", // Will change to advance_paid after payment
          advancePaymentStatus: "pending",
          finalPaymentStatus: "pending",
          confirmationStatus: "pending",
        })
        .returning();

      return newBooking[0];
    }, "createBooking");

    return sendCreated(res, booking, "Booking created successfully");
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

    const bookings = await withDatabaseErrorHandling(async () => {
      return await db.query.bookingsTable.findMany({
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
    }, "getBookingByDateRange");

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

    const bookings = await withDatabaseErrorHandling(async () => {
      return await db.query.bookingsTable.findMany({
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
    }, "getBookingByDateRangeByCarId");

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

    const booking = await withDatabaseErrorHandling(async () => {
      const updatedBooking = await db
        .update(bookingsTable)
        .set(updateData)
        .where(eq(bookingsTable.id, parseInt(id)))
        .returning();

      if (!updatedBooking || updatedBooking.length === 0) {
        throw ApiError.notFound("Booking not found");
      }

      return updatedBooking[0];
    }, "updatebooking");

    return sendUpdated(res, booking, "Booking updated successfully");
  }
);

export const deletebooking = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid booking ID");
    }

    const booking = await withDatabaseErrorHandling(async () => {
      const deletedBooking = await db
        .delete(bookingsTable)
        .where(eq(bookingsTable.id, parseInt(id)))
        .returning();

      if (!deletedBooking || deletedBooking.length === 0) {
        throw ApiError.notFound("Booking not found");
      }

      return deletedBooking[0];
    }, "deletebooking");

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

    const booking = await withDatabaseErrorHandling(async () => {
      const foundBooking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(id)),
        with: {
          car: true,
          pickupParking: true,
          dropoffParking: true,
          user: true,
        },
      });

      if (!foundBooking) {
        throw ApiError.notFound("Booking not found");
      }

      return foundBooking;
    }, "getbookingbyid");

    return sendItem(res, booking, "Booking fetched successfully");
  }
);

export const getbookingbyuserid = asyncHandler(
  async (req: Request, res: Response) => {
    const { userid } = req.params;

    // Validate user ID
    if (!userid || !/^[0-9]+$/.test(userid)) {
      throw ApiError.badRequest("Invalid user ID");
    }

    const bookings = await withDatabaseErrorHandling(async () => {
      return await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) =>
          eq(bookingsTable.userId, parseInt(userid)),
        with: {
          car: true,
          pickupParking: true,
          dropoffParking: true,
          user: true,
        },
      });
    }, "getbookingbyuserid");

    return sendList(
      res,
      bookings,
      bookings.length,
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

    const bookings = await withDatabaseErrorHandling(async () => {
      return await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) =>
          eq(bookingsTable.carId, parseInt(carid)),
        with: {
          car: true,
          pickupParking: true,
          dropoffParking: true,
          user: true,
        },
      });
    }, "getbookingbycarid");

    return sendList(
      res,
      bookings,
      bookings.length,
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

    const bookings = await withDatabaseErrorHandling(async () => {
      return await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) =>
          eq(bookingsTable.pickupParkingId, parseInt(id)),
        with: {
          car: true,
          pickupParking: true,
          dropoffParking: true,
          user: true,
        },
      });
    }, "getbookingbypickupParkingId");

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

    const bookings = await withDatabaseErrorHandling(async () => {
      return await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) =>
          eq(bookingsTable.dropoffParkingId, parseInt(id)),
        with: {
          car: true,
          pickupParking: true,
          dropoffParking: true,
          user: true,
        },
      });
    }, "getbookingbydropoffParkingId");

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

    const booking = await withDatabaseErrorHandling(async () => {
      const foundBooking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!foundBooking) {
        throw ApiError.notFound("Booking not found");
      }

      if (foundBooking.userId !== req.user.id) {
        throw ApiError.forbidden(
          "You can only confirm payments for your own bookings"
        );
      }

      if (foundBooking.advancePaymentStatus === "paid") {
        throw ApiError.conflict("Advance payment already confirmed");
      }

      const updatedBooking = await db
        .update(bookingsTable)
        .set({
          advancePaymentStatus: "paid",
          advancePaymentReferenceId: paymentReferenceId,
          status: "advance_paid",
        })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      return updatedBooking[0];
    }, "confirmAdvancePayment");

    return sendUpdated(res, booking, "Advance payment confirmed successfully");
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

    const booking = await withDatabaseErrorHandling(async () => {
      const foundBooking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!foundBooking) {
        throw ApiError.notFound("Booking not found");
      }

      if (foundBooking.userId !== req.user.id) {
        throw ApiError.forbidden(
          "You can only submit confirmation requests for your own bookings"
        );
      }

      if (foundBooking.advancePaymentStatus !== "paid") {
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

      return updatedBooking[0];
    }, "submitConfirmationRequest");

    return sendUpdated(
      res,
      booking,
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

    const booking = await withDatabaseErrorHandling(async () => {
      const foundBooking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!foundBooking) {
        throw ApiError.notFound("Booking not found");
      }

      if (foundBooking.confirmationStatus !== "pending_approval") {
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

      return updatedBooking[0];
    }, "picApproveConfirmation");

    const message = approved
      ? "Booking approved successfully"
      : "Booking rejected";
    return sendUpdated(res, booking, message);
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

    const booking = await withDatabaseErrorHandling(async () => {
      const foundBooking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!foundBooking) {
        throw ApiError.notFound("Booking not found");
      }

      if (foundBooking.userId !== req.user.id) {
        throw ApiError.forbidden(
          "You can only confirm payments for your own bookings"
        );
      }

      if (foundBooking.confirmationStatus !== "approved") {
        throw ApiError.badRequest(
          "Booking must be approved before final payment"
        );
      }

      if (foundBooking.finalPaymentStatus === "paid") {
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

      return updatedBooking[0];
    }, "confirmFinalPayment");

    return sendUpdated(res, booking, "Final payment confirmed successfully");
  }
);

export const getPICDashboard = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const dashboardData = await withDatabaseErrorHandling(async () => {
      // Get bookings that need PIC approval
      const pendingApprovals = await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq }) =>
          eq(bookingsTable.confirmationStatus, "pending_approval"),
        with: {
          car: true,
          user: true,
          pickupParking: true,
          dropoffParking: true,
        },
      });

      // Get upcoming vendor cars (for vendor tab)
      const upcomingVendorCars = await db.query.carModel.findMany({
        where: (carModel, { eq }) => eq(carModel.status, "unavailable"),
        with: {
          vendor: true,
          parking: true,
        },
      });

      return {
        pendingApprovals,
        upcomingVendorCars,
      };
    }, "getPICDashboard");

    return sendSuccess(
      res,
      dashboardData,
      "PIC dashboard data retrieved successfully"
    );
  }
);
