import { asyncHandler } from "../utils/asyncHandler";
import { db } from "../../drizzle/db";
import { parkingTable } from "./parkingmodel";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Request, Response } from "express";
import { and, eq, sql, like } from "drizzle-orm";

export const getParking = asyncHandler(async (req: Request, res: Response) => {
  try {
    const parking = await db.select().from(parkingTable);
    return res
      .status(200)
      .json(new ApiResponse(200, parking, "Parking fetched successfully"));
  } catch (error) {
    console.log(error);
    throw new ApiError(500, "Failed to fetch parking");
  }
});

export const getParkingByFilter = asyncHandler(
  async (req: Request, res: Response) => {
    const { state, pincode, name, city, locality, country } = req.body;

    try {
      // Build dynamic where conditions based on provided filters
      const conditions = [];

      if (state) {
        conditions.push(eq(parkingTable.state, state));
      }

      if (pincode) {
        conditions.push(eq(parkingTable.pincode, pincode));
      }

      if (name) {
        conditions.push(
          like(sql`lower(${parkingTable.name})`, `%${name.toLowerCase()}%`)
        );
      }

      if (city) {
        conditions.push(
          like(sql`lower(${parkingTable.city})`, `%${city.toLowerCase()}%`)
        );
      }

      if (locality) {
        conditions.push(
          like(
            sql`lower(${parkingTable.locality})`,
            `%${locality.toLowerCase()}%`
          )
        );
      }

      if (country) {
        conditions.push(
          like(
            sql`lower(${parkingTable.country})`,
            `%${country.toLowerCase()}%`
          )
        );
      }

      // If no filters provided, return all parking
      if (conditions.length === 0) {
        const parking = await db.select().from(parkingTable);
        return res
          .status(200)
          .json(
            new ApiResponse(200, parking, "All parking fetched successfully")
          );
      }

      // Apply filters using AND condition
      const parking = await db
        .select()
        .from(parkingTable)
        .where(and(...conditions));

      if (parking.length === 0) {
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              [],
              "No parking found with the specified filters"
            )
          );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, parking, "Filtered parking fetched successfully")
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to fetch filtered parking");
    }
  }
);

export const getNearByParking = asyncHandler(
  async (req: Request, res: Response) => {
    const { lat, lng, radius = 500 } = req.body; // radius in kilometers, default 500km

    try {
      // Validate input coordinates
      if (!lat || !lng) {
        throw new ApiError(400, "Latitude and longitude are required");
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new ApiError(400, "Invalid coordinates provided");
      }

      // Haversine formula to calculate distance between two points on Earth
      // Distance = 2 * R * asin(sqrt(sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)))
      // Where R = Earth's radius (6371 km)
      const parking = await db
        .select({
          id: parkingTable.id,
          name: parkingTable.name,
          locality: parkingTable.locality,
          city: parkingTable.city,
          state: parkingTable.state,
          country: parkingTable.country,
          pincode: parkingTable.pincode,
          capacity: parkingTable.capacity,
          mainimg: parkingTable.mainimg,
          images: parkingTable.images,
          lat: parkingTable.lat,
          lng: parkingTable.lng,
          distance: sql<number>`
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingTable.lat})) * 
                        cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingTable.lat}))
                    )) as distance
                `,
          createdAt: parkingTable.createdAt,
          updatedAt: parkingTable.updatedAt,
        })
        .from(parkingTable)
        .where(
          sql`
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingTable.lat})) * 
                    cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingTable.lat}))
                )) <= ${radius}
            `
        )
        .orderBy(sql`distance`);

      if (parking.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "No parking found"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, parking, "Nearby parking fetched successfully")
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to fetch nearby parking");
    }
  }
);

export const getParkingById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // First get the parking details
      const parking = await db
        .select()
        .from(parkingTable)
        .where(eq(parkingTable.id, parseInt(id)));

      if (parking.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, [], "No parking found"));
      }

      // Import carModel for the query
      const { carModel } = await import("../car/carmodel");

      // Get all cars in this parking location
      const cars = await db
        .select({
          id: carModel.id,
          name: carModel.name,
          number: carModel.number,
          price: carModel.price,
          discountprice: carModel.discountprice,
          color: carModel.color,
          rcnumber: carModel.rcnumber,
          rcimg: carModel.rcimg,
          pollutionimg: carModel.pollutionimg,
          insuranceimg: carModel.insuranceimg,
          inmaintainance: carModel.inmaintainance,
          isavailable: carModel.isavailable,
          images: carModel.images,
          vendorid: carModel.vendorid,
          parkingid: carModel.parkingid,
          status: carModel.status,
          createdAt: carModel.createdAt,
          updatedAt: carModel.updatedAt,
        })
        .from(carModel)
        .where(eq(carModel.parkingid, parseInt(id)));

      // Combine parking details with cars
      const result = {
        parking: parking[0],
        cars: cars,
        totalCars: cars.length,
        availableCars: cars.filter((car) => car.isavailable).length,
      };

      return res
        .status(200)
        .json(
          new ApiResponse(200, result, "Parking with cars fetched successfully")
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to fetch parking");
    }
  }
);

//admin

export const createParking = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
      if (
        req.user &&
        (req.user.role === "admin" || req.user.role === "parkingincharge")
      ) {
        // Validate that req.body exists and has required fields
        if (!req.body || Object.keys(req.body).length === 0) {
          throw new ApiError(400, "Request body is required");
        }

        const parking = await db
          .insert(parkingTable)
          .values(req.body)
          .returning();

        return res
          .status(200)
          .json(new ApiResponse(200, parking, "Parking added successfully"));
      } else {
        throw new ApiError(403, "You are not authorized to add parking");
      }
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to add parking");
    }
  }
);

export const updateParking = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
      if (
        req.user &&
        (req.user.role === "admin" || req.user.role === "parkingincharge")
      ) {
        const { id } = req.params;
        const parking = await db
          .update(parkingTable)
          .set(req.body)
          .where(eq(parkingTable.id, parseInt(id)))
          .returning();

        return res
          .status(200)
          .json(new ApiResponse(200, parking, "Parking updated successfully"));
      } else {
        throw new ApiError(403, "You are not authorized to update parking");
      }
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to update parking");
    }
  }
);

export const deleteParking = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
      if (
        req.user &&
        (req.user.role === "admin" || req.user.role === "parkingincharge")
      ) {
        const { id } = req.params;
        const parking = await db
          .delete(parkingTable)
          .where(eq(parkingTable.id, parseInt(id)));

        return res
          .status(200)
          .json(new ApiResponse(200, parking, "Parking deleted successfully"));
      } else {
        throw new ApiError(403, "You are not authorized to delete parking");
      }
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to delete parking");
    }
  }
);

export const getParkingByIDadmin = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
      if (
        req.user &&
        (req.user.role === "admin" || req.user.role === "parkingincharge")
      ) {
        const { id } = req.params;

        // Get parking details
        const parking = await db
          .select()
          .from(parkingTable)
          .where(eq(parkingTable.id, parseInt(id)));

        if (parking.length === 0) {
          return res
            .status(200)
            .json(new ApiResponse(200, [], "No parking found"));
        }

        // Import required models
        const { carModel } = await import("../car/carmodel");
        const { UserTable } = await import("../user/usermodel");

        // Get parking incharge (users with parkingincharge role assigned to this parking)
        const parkingIncharge = await db
          .select({
            id: UserTable.id,
            name: UserTable.name,
            email: UserTable.email,
            number: UserTable.number,
            role: UserTable.role,
            isverified: UserTable.isverified,
            avatar: UserTable.avatar,
            createdAt: UserTable.createdAt,
            updatedAt: UserTable.updatedAt,
          })
          .from(UserTable)
          .where(
            and(
              eq(UserTable.role, "parkingincharge"),
              eq(UserTable.parkingid, parseInt(id))
            )
          );

        // Get all cars in this parking location
        const cars = await db
          .select({
            id: carModel.id,
            name: carModel.name,
            number: carModel.number,
            price: carModel.price,
            discountprice: carModel.discountprice,
            color: carModel.color,
            rcnumber: carModel.rcnumber,
            rcimg: carModel.rcimg,
            pollutionimg: carModel.pollutionimg,
            insuranceimg: carModel.insuranceimg,
            inmaintainance: carModel.inmaintainance,
            isavailable: carModel.isavailable,
            images: carModel.images,
            vendorid: carModel.vendorid,
            parkingid: carModel.parkingid,
            status: carModel.status,
            createdAt: carModel.createdAt,
            updatedAt: carModel.updatedAt,
          })
          .from(carModel)
          .where(eq(carModel.parkingid, parseInt(id)));

        // Combine all data
        const result = {
          parking: parking[0],
          parkingIncharge: parkingIncharge,
          cars: cars,
          totalCars: cars.length,
          availableCars: cars.filter((car) => car.isavailable).length,
          approvedCars: cars.filter((car) => car.status === "available").length,
          inMaintenanceCars: cars.filter((car) => car.inmaintainance).length,
        };

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              result,
              "Parking details with incharge and cars fetched successfully"
            )
          );
      } else {
        throw new ApiError(403, "You are not authorized to fetch parking");
      }
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to fetch parking");
    }
  }
);
