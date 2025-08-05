import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { bookingsTable } from "./bookingmodel";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { eq, between, and, gte, lte } from "drizzle-orm";
import { carModel } from "../car/carmodel";

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

      // Convert string dates to Date objects
      // Check if user is verified (assume user object may have isverified property)
      if ((req.user as any).isverified === false) {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              null,
              "please login and verify your account to continue"
            )
          );
      }
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      const extentiontill = req.body.extentiontill
        ? new Date(req.body.extentiontill)
        : null;

      // Check for overlapping bookings for the same car
      const overlappingBookings = await db.query.bookingsTable.findMany({
        where: (bookingsTable, { eq, and, lte, gte }) =>
          and(
            eq(bookingsTable.carId, req.body.carId),
            lte(bookingsTable.startDate, endDate),
            gte(bookingsTable.endDate, startDate)
          ),
      });

      if (overlappingBookings.length > 0) {
        // Return the conflicting booking dates
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

      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const price = (carprice[0]?.discountprice || 0) * days;
      const totalPrice = price + (req.body.extensionPrice || 0);

      const booking = await db
        .insert(bookingsTable)
        .values({
          ...req.body,
          userId: Number(req.user.id),
          price: price,
          totalPrice: totalPrice,
          startDate: startDate,
          endDate: endDate,
          extentiontill: extentiontill,
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
        .status(201)
        .json(
          new ApiResponse(201, bookingdetails, "Booking created successfully")
        );
    } catch (error) {
      console.log(error);
      res.status(500).json(new ApiResponse(500, null, "Internal server error"));
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
