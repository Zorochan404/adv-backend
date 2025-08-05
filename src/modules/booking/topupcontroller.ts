import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { topupTable, bookingTopupTable } from "./topupmodel";
import { bookingsTable } from "./bookingmodel";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { eq, and, desc } from "drizzle-orm";

// Extend the Request interface to include 'user' property
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    role?: string;
  };
}

// Create topup (Admin only)
export const createTopup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can create topups");
      }

      const { name, description, duration, price, category } = req.body;

      if (!name || !duration || !price) {
        throw new ApiError(400, "Name, duration, and price are required");
      }

      const topup = await db
        .insert(topupTable)
        .values({
          name,
          description,
          duration: parseInt(duration),
          price: parseFloat(price),
          category: category || "extension",
          createdBy: req.user.id,
        })
        .returning();

      return res
        .status(201)
        .json(new ApiResponse(201, topup[0], "Topup created successfully"));
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to create topup");
    }
  }
);

// Get all active topups
export const getActiveTopups = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const topups = await db
        .select()
        .from(topupTable)
        .where(eq(topupTable.isActive, true))
        .orderBy(desc(topupTable.createdAt));

      return res
        .status(200)
        .json(
          new ApiResponse(200, topups, "Active topups fetched successfully")
        );
    } catch (error) {
      console.log(error);
      throw new ApiError(500, "Failed to fetch topups");
    }
  }
);

// Apply topup to booking
export const applyTopupToBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookingId, topupId, paymentReferenceId } = req.body;

      // Get booking details
      const booking = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
      });

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      if (booking.userId !== req.user.id) {
        throw new ApiError(
          403,
          "You can only apply topups to your own bookings"
        );
      }

      if (booking.status !== "active") {
        throw new ApiError(400, "Topup can only be applied to active bookings");
      }

      // Get topup details
      const topup = await db.query.topupTable.findFirst({
        where: (topupTable, { eq }) => eq(topupTable.id, topupId),
      });

      if (!topup) {
        throw new ApiError(404, "Topup not found");
      }

      if (!topup.isActive) {
        throw new ApiError(400, "This topup is not available");
      }

      // Calculate new end date
      const currentEndDate = new Date(booking.endDate);
      const newEndDate = new Date(
        currentEndDate.getTime() + topup.duration * 60 * 60 * 1000
      );

      // Create booking topup record
      const bookingTopup = await db
        .insert(bookingTopupTable)
        .values({
          bookingId: bookingId,
          topupId: topupId,
          appliedAt: new Date(),
          originalEndDate: currentEndDate,
          newEndDate: newEndDate,
          amount: topup.price,
          paymentStatus: "paid",
          paymentReferenceId: paymentReferenceId,
        })
        .returning();

      // Update booking end date and extension details
      await db
        .update(bookingsTable)
        .set({
          endDate: newEndDate,
          extensionPrice: (booking.extensionPrice || 0) + topup.price,
          extensionTill: newEndDate,
          extensionTime: (booking.extensionTime || 0) + topup.duration,
          updatedAt: new Date(),
        })
        .where(eq(bookingsTable.id, bookingId));

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            bookingTopup: bookingTopup[0],
            newEndDate: newEndDate,
            extensionHours: topup.duration,
          },
          "Topup applied successfully"
        )
      );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to apply topup");
    }
  }
);

// Get booking topups
export const getBookingTopups = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { bookingId } = req.params;

      const topups = await db.query.bookingTopupTable.findMany({
        where: (bookingTopupTable, { eq }) =>
          eq(bookingTopupTable.bookingId, parseInt(bookingId)),
        with: {
          topup: true,
        },
        orderBy: (bookingTopupTable, { desc }) =>
          desc(bookingTopupTable.createdAt),
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, topups, "Booking topups fetched successfully")
        );
    } catch (error) {
      console.log(error);
      throw new ApiError(500, "Failed to fetch booking topups");
    }
  }
);

// Admin: Get all topups
export const getAllTopups = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can view all topups");
      }

      const topups = await db
        .select()
        .from(topupTable)
        .orderBy(desc(topupTable.createdAt));

      return res
        .status(200)
        .json(new ApiResponse(200, topups, "All topups fetched successfully"));
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to fetch topups");
    }
  }
);

// Admin: Update topup
export const updateTopup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can update topups");
      }

      const { id } = req.params;
      const { name, description, duration, price, category, isActive } =
        req.body;

      const topup = await db
        .update(topupTable)
        .set({
          name,
          description,
          duration: duration ? parseInt(duration) : undefined,
          price: price ? parseFloat(price) : undefined,
          category,
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(topupTable.id, parseInt(id)))
        .returning();

      if (!topup[0]) {
        throw new ApiError(404, "Topup not found");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, topup[0], "Topup updated successfully"));
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to update topup");
    }
  }
);

// Admin: Delete topup
export const deleteTopup = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can delete topups");
      }

      const { id } = req.params;

      const topup = await db
        .delete(topupTable)
        .where(eq(topupTable.id, parseInt(id)))
        .returning();

      if (!topup[0]) {
        throw new ApiError(404, "Topup not found");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, null, "Topup deleted successfully"));
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to delete topup");
    }
  }
);
