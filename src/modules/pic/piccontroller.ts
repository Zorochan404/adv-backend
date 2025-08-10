import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { db } from "../../drizzle/db";
import { bookingsTable } from "../booking/bookingmodel";
import { carModel } from "../car/carmodel";
import { UserTable } from "../user/usermodel";
import { carCatalogTable } from "../car/carmodel";
import { eq, and, gte, lte, inArray } from "drizzle-orm";

// Extend the Request interface to include 'user' property
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    parkingid: number;
    role: string;
  };
}

// Get cars coming for pickup at PIC's parking lot
export const getPickupCars = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const picParkingId = req.user.parkingid;

    if (!picParkingId) {
      throw new ApiResponse(400, null, "PIC must be assigned to a parking lot");
    }

    // Get all cars in PIC's parking lot that are booked and ready for pickup
    const pickupCars = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { and, eq, inArray }) => {
        // Get cars in PIC's parking lot
        const carsInParking = db
          .select({ carId: carModel.id })
          .from(carModel)
          .where(eq(carModel.parkingid, picParkingId));

        return and(
          inArray(bookingsTable.carId, carsInParking),
          eq(bookingsTable.status, "confirmed"), // Only confirmed bookings
          eq(bookingsTable.picApproved, true) // Only PIC approved bookings
        );
      },
      with: {
        car: {
          with: {
            catalog: true,
            vendor: {
              columns: {
                id: true,
                name: true,
                email: true,
                number: true,
              },
            },
          },
        },
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            number: true,
          },
        },
      },
      orderBy: (bookingsTable, { asc }) => [asc(bookingsTable.pickupDate)],
    });

    // Transform the data to include required fields
    const transformedCars = pickupCars.map((booking) => ({
      id: `car${booking.car.id}`,
      bookingId: booking.id,
      carId: booking.car.id,
      userId: booking.user.id,
      licensePlate: booking.car.number,
      model: booking.car.catalog?.carName || booking.car.name,
      pickupTime: booking.pickupDate || booking.startDate,
      customerName: booking.user.name,
      customerEmail: booking.user.email,
      customerPhone: booking.user.number,
      status: "ready_for_pickup",
      carColor: booking.car.color,
      carPrice: booking.car.price,
      vendorName: booking.car.vendor?.name,
    }));

    const responseData = {
      cars: transformedCars,
      total: transformedCars.length,
    };

    res
      .status(200)
      .json(
        new ApiResponse(200, responseData, "Pickup cars retrieved successfully")
      );
  }
);

// Get cars coming for dropoff at PIC's parking lot
export const getDropoffCars = asyncHandler<AuthenticatedRequest>(
  async (req: AuthenticatedRequest, res: Response) => {
    const picParkingId = req.user.parkingid;

    if (!picParkingId) {
      throw new ApiResponse(400, null, "PIC must be assigned to a parking lot");
    }

    // Get all cars that are currently active (out for rental) and need to be returned
    const dropoffCars = await db.query.bookingsTable.findMany({
      where: (bookingsTable, { and, eq, inArray }) => {
        // Get cars in PIC's parking lot
        const carsInParking = db
          .select({ carId: carModel.id })
          .from(carModel)
          .where(eq(carModel.parkingid, picParkingId));

        return and(
          inArray(bookingsTable.carId, carsInParking),
          eq(bookingsTable.status, "active") // Only active bookings (car is out)
        );
      },
      with: {
        car: {
          with: {
            catalog: true,
            vendor: {
              columns: {
                id: true,
                name: true,
                email: true,
                number: true,
              },
            },
          },
        },
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            number: true,
          },
        },
      },
      orderBy: (bookingsTable, { asc }) => [asc(bookingsTable.endDate)],
    });

    // Transform the data to include required fields
    const transformedCars = dropoffCars.map((booking) => ({
      id: `car${booking.car.id}`,
      bookingId: booking.id,
      carId: booking.car.id,
      userId: booking.user.id,
      licensePlate: booking.car.number,
      model: booking.car.catalog?.carName || booking.car.name,
      dropoffTime: booking.endDate,
      expectedDropoffTime: booking.endDate,
      customerName: booking.user.name,
      customerEmail: booking.user.email,
      customerPhone: booking.user.number,
      status: "scheduled_for_dropoff",
      carColor: booking.car.color,
      carPrice: booking.car.price,
      vendorName: booking.car.vendor?.name,
      startDate: booking.startDate,
      actualPickupDate: booking.actualPickupDate,
    }));

    const responseData = {
      cars: transformedCars,
      total: transformedCars.length,
    };

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          responseData,
          "Dropoff cars retrieved successfully"
        )
      );
  }
);
