import { asyncHandler } from "../utils/asyncHandler";
import { db } from "../../drizzle/db";
import { parkingTable } from "./parkingmodel";
import { ApiError } from "../utils/apiError";
import { Request, Response } from "express";
import { and, eq, sql, like } from "drizzle-orm";
import {
  sendSuccess,
  sendItem,
  sendList,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendPaginated,
} from "../utils/responseHandler";
import { withDatabaseErrorHandling } from "../utils/dbErrorHandler";

export const getParking = asyncHandler(async (req: Request, res: Response) => {
  const parking = await withDatabaseErrorHandling(async () => {
    return await db.select().from(parkingTable);
  }, "getParking");

  return sendList(res, parking, parking.length, "Parking fetched successfully");
});

export const getParkingByFilter = asyncHandler(
  async (req: Request, res: Response) => {
    const { state, pincode, name, city, locality, country } = req.query;

    const parking = await withDatabaseErrorHandling(async () => {
      // Build dynamic where conditions based on provided filters
      const conditions = [];

      if (state) {
        conditions.push(eq(parkingTable.state, state as string));
      }

      if (pincode) {
        conditions.push(eq(parkingTable.pincode, parseInt(pincode as string)));
      }

      if (name) {
        conditions.push(
          like(
            sql`lower(${parkingTable.name})`,
            `%${(name as string).toLowerCase()}%`
          )
        );
      }

      if (city) {
        conditions.push(
          like(
            sql`lower(${parkingTable.city})`,
            `%${(city as string).toLowerCase()}%`
          )
        );
      }

      if (locality) {
        conditions.push(
          like(
            sql`lower(${parkingTable.locality})`,
            `%${(locality as string).toLowerCase()}%`
          )
        );
      }

      if (country) {
        conditions.push(
          like(
            sql`lower(${parkingTable.country})`,
            `%${(country as string).toLowerCase()}%`
          )
        );
      }

      // If no filters provided, return all parking
      if (conditions.length === 0) {
        return await db.select().from(parkingTable);
      }

      // Apply filters using AND condition
      return await db
        .select()
        .from(parkingTable)
        .where(and(...conditions));
    }, "getParkingByFilter");

    if (parking.length === 0) {
      return sendList(
        res,
        [],
        0,
        "No parking found with the specified filters"
      );
    }

    return sendList(
      res,
      parking,
      parking.length,
      "Filtered parking fetched successfully"
    );
  }
);

export const getNearByParking = asyncHandler(
  async (req: Request, res: Response) => {
    // Support both GET (query params) and POST (body)
    const {
      lat,
      lng,
      radius = 500,
      limit = 10,
      page = 1,
    } = req.method === "GET" ? req.query : req.body;

    // Validate input coordinates
    if (!lat || !lng) {
      throw ApiError.badRequest("Latitude and longitude are required");
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw ApiError.badRequest("Invalid coordinates provided");
    }

    // Parse and validate pagination parameters
    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const offset = (pageNum - 1) * limitNum;

    const result = await withDatabaseErrorHandling(async () => {
      // Get total count first for pagination
      const totalCountQuery = await db
        .select({ count: sql<number>`count(*)` })
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
        );

      const total = totalCountQuery[0]?.count || 0;

      // Get paginated results
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
        .orderBy(sql`distance`)
        .limit(limitNum)
        .offset(offset);

      return { parking, total };
    }, "getNearByParking");

    if (result.parking.length === 0) {
      return sendPaginated(
        res,
        [],
        result.total,
        pageNum,
        limitNum,
        "No parking found"
      );
    }

    return sendPaginated(
      res,
      result.parking,
      result.total,
      pageNum,
      limitNum,
      "Nearby parking fetched successfully"
    );
  }
);

export const getParkingById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid parking ID");
    }

    const result = await withDatabaseErrorHandling(async () => {
      // First get the parking details
      const parking = await db
        .select()
        .from(parkingTable)
        .where(eq(parkingTable.id, parseInt(id)));

      if (parking.length === 0) {
        throw ApiError.notFound("Parking not found");
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
      return {
        parking: parking[0],
        cars: cars,
        totalCars: cars.length,
        availableCars: cars.filter((car) => car.isavailable).length,
      };
    }, "getParkingById");

    return sendItem(res, result, "Parking with cars fetched successfully");
  }
);

//admin

export const createParking = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "parkingincharge")
    ) {
      throw ApiError.forbidden("You are not authorized to add parking");
    }

    // Validate that req.body exists and has required fields
    if (!req.body || Object.keys(req.body).length === 0) {
      throw ApiError.badRequest("Request body is required");
    }

    const parking = await withDatabaseErrorHandling(async () => {
      const newParking = await db
        .insert(parkingTable)
        .values(req.body)
        .returning();

      return newParking[0];
    }, "createParking");

    return sendCreated(res, parking, "Parking added successfully");
  }
);

export const updateParking = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "parkingincharge")
    ) {
      throw ApiError.forbidden("You are not authorized to update parking");
    }

    const { id } = req.params;

    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid parking ID");
    }

    const parking = await withDatabaseErrorHandling(async () => {
      const updatedParking = await db
        .update(parkingTable)
        .set(req.body)
        .where(eq(parkingTable.id, parseInt(id)))
        .returning();

      if (!updatedParking || updatedParking.length === 0) {
        throw ApiError.notFound("Parking not found");
      }

      return updatedParking[0];
    }, "updateParking");

    return sendUpdated(res, parking, "Parking updated successfully");
  }
);

export const deleteParking = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "parkingincharge")
    ) {
      throw ApiError.forbidden("You are not authorized to delete parking");
    }

    const { id } = req.params;

    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid parking ID");
    }

    await withDatabaseErrorHandling(async () => {
      const deletedParking = await db
        .delete(parkingTable)
        .where(eq(parkingTable.id, parseInt(id)))
        .returning();

      if (!deletedParking || deletedParking.length === 0) {
        throw ApiError.notFound("Parking not found");
      }
    }, "deleteParking");

    return sendDeleted(res, "Parking deleted successfully");
  }
);

export const getParkingByIDadmin = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    if (
      !req.user ||
      (req.user.role !== "admin" && req.user.role !== "parkingincharge")
    ) {
      throw ApiError.forbidden("You are not authorized to fetch parking");
    }

    const { id } = req.params;

    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid parking ID");
    }

    const result = await withDatabaseErrorHandling(async () => {
      // Get parking details
      const parking = await db
        .select()
        .from(parkingTable)
        .where(eq(parkingTable.id, parseInt(id)));

      if (parking.length === 0) {
        throw ApiError.notFound("Parking not found");
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
      return {
        parking: parking[0],
        parkingIncharge: parkingIncharge,
        cars: cars,
        totalCars: cars.length,
        availableCars: cars.filter((car) => car.isavailable).length,
        approvedCars: cars.filter((car) => car.status === "available").length,
        inMaintenanceCars: cars.filter((car) => car.inmaintainance).length,
      };
    }, "getParkingByIDadmin");

    return sendItem(
      res,
      result,
      "Parking details with incharge and cars fetched successfully"
    );
  }
);
