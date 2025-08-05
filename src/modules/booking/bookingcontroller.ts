import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { bookingsTable } from "./bookingmodel";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { eq, between, and, gte, lte, sql } from "drizzle-orm";
import { carModel } from "../car/carmodel";
import { ApiError } from "../utils/apiError";

// Extend the Request interface to include 'user' property
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    // add other user properties if needed
  };
}

export const createBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const carprice = await db
        .select()
        .from(carModel)
        .where(eq(carModel.id, req.body.carId));
      if (!carprice) {
        return res
          .status(404)
          .json(new ApiResponse(404, null, "Car not found"));
      }

      // Check if user is verified
    if ((req.user as any).isverified === false) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              null,
              "Please login and verify your account to continue"
            )
          );
      }

    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    
    // Check for overlapping bookings for the same car
    const overlappingBookings = await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq, and, lte, gte }) =>
          and(
            eq(bookingsTable.carId, req.body.carId),
            lte(bookingsTable.startDate, endDate),
            gte(bookingsTable.endDate, startDate),
            // Only check active bookings (not cancelled)
            sql`${bookingsTable.status} NOT IN ('cancelled')`
          ),
    });

    if (overlappingBookings.length > 0) {
        return res.status(409).json(
          new ApiResponse(
            409,
            overlappingBookings.map((b) => ({
              startDate: b.startDate,
              endDate: b.endDate,
            })),
            "Car is already booked for the selected dates"
          )
        );
      }

      // Calculate pricing
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const basePrice =
        (carprice[0]?.discountprice || carprice[0]?.price || 0) * days;
      const advancePercentage = 0.3; // 30% advance payment (configurable by admin)
      const advanceAmount = basePrice * advancePercentage;
      const remainingAmount = basePrice - advanceAmount;
      const deliveryCharges = req.body.deliveryCharges || 0;
      const totalPrice = basePrice + deliveryCharges;

      const booking = await db
        .insert(bookingsTable)
        .values({
        ...req.body,
        userId: Number(req.user.id),
          basePrice: basePrice,
          advanceAmount: advanceAmount,
          remainingAmount: remainingAmount,
        totalPrice: totalPrice,
        startDate: startDate,
        endDate: endDate,
          status: "pending", // Will change to advance_paid after payment
          advancePaymentStatus: "pending",
          finalPaymentStatus: "pending",
          confirmationStatus: "pending",
        })
        .returning();

      if (!booking) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, "Booking not created"));
      }

    const bookingdetails = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, booking[0].id),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
          user: true,
        },
      });

      return res.status(201).json(
        new ApiResponse(
          201,
          {
            booking: bookingdetails,
            paymentDetails: {
              basePrice: basePrice,
              advanceAmount: advanceAmount,
              remainingAmount: remainingAmount,
              totalPrice: totalPrice,
              deliveryCharges: deliveryCharges,
            },
          },
          "Booking created successfully. Please complete advance payment to confirm."
        )
      );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to create booking");
    }
  }
);

export const getBookings = asyncHandler(async (req: Request, res: Response) => {
    try {
        const booking = await db.query.bookingsTable.findMany({
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
    res
      .status(200)
      .json(new ApiResponse(200, booking, "Bookings fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});

export const getBookingByDateRange = asyncHandler(
  async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.body;
        
        // Validate input
        if (!startDate || !endDate) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, null, "Start date and end date are required")
          );
        }
        
        // Convert string dates to Date objects
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
   
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, "Invalid date format"));
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

      res
        .status(200)
        .json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getBookingByDateRangeByCarId = asyncHandler(
  async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.body;
        
        // Validate input
        if (!startDate || !endDate) {
        return res
          .status(400)
          .json(
            new ApiResponse(400, null, "Start date and end date are required")
          );
        }
        
        // Convert string dates to Date objects
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
   
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res
          .status(400)
          .json(new ApiResponse(400, null, "Invalid date format"));
      }

      const bookings = await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq, and, lte, gte }) =>
          and(
                    eq(bookingsTable.carId, parseInt(req.params.id)),
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

      res
        .status(200)
        .json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getbookingbyid = asyncHandler(
  async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Import required models
        const { carModel } = await import("../car/carmodel");
        const { parkingTable } = await import("../parking/parkingmodel");
        const { UserTable } = await import("../user/usermodel");
        
        // Get booking with car and user details
        const result = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, parseInt(id)),
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

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Booking with details fetched successfully"
          )
        );
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const updatebooking = asyncHandler(
  async (req: Request, res: Response) => {
    try {
        // Validate and convert date fields if present
        const updateData: any = { ...req.body };

        if (updateData.startDate) {
            const startDate = new Date(updateData.startDate);
            if (isNaN(startDate.getTime())) {
          return res
            .status(400)
            .json(new ApiResponse(400, null, "Invalid startDate format"));
            }
            updateData.startDate = startDate;
        }
        if (updateData.endDate) {
            const endDate = new Date(updateData.endDate);
            if (isNaN(endDate.getTime())) {
          return res
            .status(400)
            .json(new ApiResponse(400, null, "Invalid endDate format"));
            }
            updateData.endDate = endDate;
        }
        if (updateData.extentiontill) {
            const extentiontill = new Date(updateData.extentiontill);
            if (isNaN(extentiontill.getTime())) {
          return res
            .status(400)
            .json(new ApiResponse(400, null, "Invalid extentiontill format"));
            }
            updateData.extentiontill = extentiontill;
        }

      const booking = await db
        .update(bookingsTable)
        .set(updateData)
        .where(eq(bookingsTable.id, parseInt(req.params.id)))
        .returning();
        // After updating the booking
        if (updateData.status === "active") {
            // Fetch the booking to get the carId
            const updatedBooking = await db.query.bookingsTable.findFirst({
          where: (bookingsTable, { eq }) =>
            eq(bookingsTable.id, parseInt(req.params.id)),
            });
            if (updatedBooking && updatedBooking.carId) {
          await db
            .update(carModel)
                    .set({ isavailable: false })
                    .where(eq(carModel.id, updatedBooking.carId));
            }
        }
      if (
        updateData.status === "completed" ||
        updateData.status === "cancelled"
      ) {
            const updatedBooking = await db.query.bookingsTable.findFirst({
          where: (bookingsTable, { eq }) =>
            eq(bookingsTable.id, parseInt(req.params.id)),
            });
            if (updatedBooking && updatedBooking.carId) {
          await db
            .update(carModel)
                    .set({ isavailable: true })
                    .where(eq(carModel.id, updatedBooking.carId));
            }
        }
      res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking updated successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const deletebooking = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const booking = await db
        .delete(bookingsTable)
        .where(eq(bookingsTable.id, parseInt(req.params.id)));
      res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking deleted successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getbookingbystatus = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const booking = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.status, req.body.status));
      res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getbookingbyuserid = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const booking = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.userId, parseInt(req.params.id)));
      res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getbookingbycarid = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const booking = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.carId, parseInt(req.params.id)));
      res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

//admin routes
export const getbookingbypickupParkingId = asyncHandler(
  async (req: Request, res: Response) => {
    try {
        // Fix: Properly check user role and handle missing req.user
        const user = (req as any).user;
        console.log(user);
        if (!user || (user.role !== "admin" && user.role !== "parkingincharge")) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              null,
              "You are not authorized to access this resource"
            )
          );
      }
      const booking = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.pickupParkingId, parseInt(req.params.id)));
      res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

export const getbookingbydropoffParkingId = asyncHandler(
  async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        console.log(user);
        if (!user || (user.role !== "admin" && user.role !== "parkingincharge")) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              null,
              "You are not authorized to access this resource"
            )
          );
      }
      const booking = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.dropoffParkingId, parseInt(req.params.id)));
      res
        .status(200)
        .json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
  }
);

// Advance Payment Confirmation
export const confirmAdvancePayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId, paymentReferenceId } = req.body;

      const booking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      if (booking.userId !== req.user.id) {
        throw new ApiError(403, "You can only confirm your own bookings");
      }

      if (booking.status !== "pending") {
        throw new ApiError(400, "Booking is not in pending status");
      }

      // Update booking status
      await db
        .update(bookingsTable)
        .set({
          status: "advance_paid",
          advancePaymentStatus: "paid",
          advancePaymentReferenceId: paymentReferenceId,
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            "Advance payment confirmed. You can now proceed with car pickup."
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to confirm advance payment");
    }
  }
);

// Submit Confirmation Request (User uploads car condition images)
export const submitConfirmationRequest = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId, carConditionImages, toolImages, tools } = req.body;

      const booking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      if (booking.userId !== req.user.id) {
        throw new ApiError(
          403,
          "You can only submit confirmation for your own bookings"
        );
      }

      if (booking.status !== "advance_paid") {
        throw new ApiError(400, "Booking must be in advance_paid status");
      }

      // Update booking with confirmation request
      await db
        .update(bookingsTable)
        .set({
          carConditionImages: carConditionImages,
          toolImages: toolImages,
          tools: tools,
          confirmationStatus: "pending",
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            "Confirmation request submitted. Waiting for PIC approval."
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to submit confirmation request");
    }
  }
);

// PIC Approve/Reject Confirmation Request
export const picApproveConfirmation = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId, approved, comments } = req.body;

      const booking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      // Check if user is PIC for this parking
      if (booking.pickupParkingId !== (req.user as any).parkingid) {
        throw new ApiError(
          403,
          "You can only approve bookings for your parking"
        );
      }

      if (booking.confirmationStatus !== "pending") {
        throw new ApiError(400, "Confirmation request is not pending");
      }

      const newStatus = approved ? "approved" : "rejected";
      const newBookingStatus = approved ? "confirmed" : "advance_paid";

      // Update booking
      await db
        .update(bookingsTable)
        .set({
          picApproved: approved,
          picApprovedAt: approved ? new Date() : null,
          picApprovedBy: approved ? req.user.id : null,
          picComments: comments,
          confirmationStatus: newStatus,
          status: newBookingStatus,
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            approved
              ? "Confirmation approved. User can now make final payment."
              : "Confirmation rejected. User can submit new request."
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to process confirmation request");
    }
  }
);

// Final Payment Confirmation
export const confirmFinalPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId, paymentReferenceId } = req.body;

      const booking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      if (booking.userId !== req.user.id) {
        throw new ApiError(403, "You can only confirm your own bookings");
      }

      if (booking.status !== "confirmed") {
        throw new ApiError(
          400,
          "Booking must be confirmed before final payment"
        );
      }

      // Update booking status
      await db
        .update(bookingsTable)
        .set({
          status: "active",
          finalPaymentStatus: "paid",
          finalPaymentReferenceId: paymentReferenceId,
          userConfirmed: true,
          userConfirmedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            "Final payment confirmed. Your booking is now active!"
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to confirm final payment");
    }
  }
);

// Get PIC Dashboard Data (Bookings for PIC's parking)
export const getPICDashboard = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parkingId = (req.user as any).parkingid;

      if (!parkingId) {
        throw new ApiError(403, "You are not assigned to any parking");
      }

      // Get pending confirmations
      const pendingConfirmations = await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq, and }) =>
          and(
            eq(bookingsTable.pickupParkingId, parkingId),
            eq(bookingsTable.confirmationStatus, "pending"),
            eq(bookingsTable.status, "advance_paid")
          ),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              number: true,
              email: true,
            },
          },
          car: {
            columns: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
        orderBy: (bookingsTable, { desc }) => desc(bookingsTable.createdAt),
      });

      // Get active bookings
      const activeBookings = await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq, and }) =>
          and(
            eq(bookingsTable.pickupParkingId, parkingId),
            eq(bookingsTable.status, "active")
          ),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              number: true,
            },
          },
          car: {
            columns: {
              id: true,
              name: true,
              number: true,
            },
          },
        },
        orderBy: (bookingsTable, { desc }) => desc(bookingsTable.createdAt),
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            pendingConfirmations,
            activeBookings,
            parkingId,
          },
          "PIC dashboard data fetched successfully"
        )
      );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to fetch PIC dashboard data");
    }
  }
);
