import { Request, Response } from "express";
import { carModel } from "./carmodel";
import { db } from "../../drizzle/db";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { and, eq, like, or, sql } from "drizzle-orm";
import { reviewModel } from "../review/reviewmodel";
import { parkingTable } from "../parking/parkingmodel";


// Test function to verify database connection
export const testCarConnection = asyncHandler(async (req: Request, res: Response) => {
    try {
        // Simple count query to test connection
        const result = await db.select({ count: sql`count(*)` }).from(carModel);
        return res.status(200).json(new ApiResponse(200, result[0], "Database connection successful"));
    } catch (error) {
        console.log("Database connection error:", error);
        throw new ApiError(500, "Database connection failed");
    }
});

export const getCar = asyncHandler(async (req: Request, res: Response) => {
    try {
        const car = await db.select().from(carModel);
        return res.status(200).json(new ApiResponse(200, car, "Car fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch car");
    }
});

export const getNearestCars = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = 500 } = req.body; // radius in kilometers, default 500km
    
    try {
        // Validate input coordinates
        if (!lat || !lng) {
            throw new ApiError(400, "Latitude and longitude are required");
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new ApiError(400, "Invalid coordinates provided");
        }

        // Use a single query with JOIN to get cars from nearby parking locations
        const cars = await db
            .select({
                id: carModel.id,
                name: carModel.name,
                maker: carModel.maker,
                year: carModel.year,
                carnumber: carModel.carnumber,
                price: carModel.price,
                discountedprice: carModel.discountedprice,
                color: carModel.color,
                transmission: carModel.transmission,
                fuel: carModel.fuel,
                type: carModel.type,
                seats: carModel.seats,
                rcnumber: carModel.rcnumber,
                rcimg: carModel.rcimg,
                pollutionimg: carModel.pollutionimg,
                insuranceimg: carModel.insuranceimg,
                inmaintainance: carModel.inmaintainance,
                isavailable: carModel.isavailable,
                images: carModel.images,
                mainimg: carModel.mainimg,
                vendorid: carModel.vendorid,
                parkingid: carModel.parkingid,
                isapproved: carModel.isapproved,
                createdAt: carModel.createdAt,
                updatedAt: carModel.updatedAt,
                parkingDistance: sql<number>`
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingTable.lat})) * 
                        cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingTable.lat}))
                    )) as parking_distance
                `,
                parkingName: parkingTable.name,
                parkingLocation: parkingTable.locality,
                parkingCity: parkingTable.city,
                parkingState: parkingTable.state
            })
            .from(carModel)
            .innerJoin(parkingTable, sql`${carModel.parkingid} = ${parkingTable.id}`)
            .where(sql`
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingTable.lat})) * 
                    cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingTable.lat}))
                )) <= ${radius}
            `)
            .orderBy(sql`parking_distance`);

        if (cars.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No cars found in nearby parking areas"));
        }

        return res.status(200).json(new ApiResponse(200, cars, "Nearby cars fetched successfully"));
    } catch (error) {
        console.log(error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to fetch nearby cars");
    }
});

export const getNearestAvailableCars = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = 500 } = req.body; // radius in kilometers, default 500km
    
    try {
        // Validate input coordinates
        if (!lat || !lng) {
            throw new ApiError(400, "Latitude and longitude are required");
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new ApiError(400, "Invalid coordinates provided");
        }

        // Use a single query with JOIN to get cars from nearby parking locations
        const cars = await db
            .select({
                id: carModel.id,
                name: carModel.name,
                maker: carModel.maker,
                year: carModel.year,
                carnumber: carModel.carnumber,
                price: carModel.price,
                discountedprice: carModel.discountedprice,
                color: carModel.color,
                transmission: carModel.transmission,
                fuel: carModel.fuel,
                type: carModel.type,
                seats: carModel.seats,
                rcnumber: carModel.rcnumber,
                rcimg: carModel.rcimg,
                pollutionimg: carModel.pollutionimg,
                insuranceimg: carModel.insuranceimg,
                inmaintainance: carModel.inmaintainance,
                isavailable: carModel.isavailable,
                images: carModel.images,
                mainimg: carModel.mainimg,
                vendorid: carModel.vendorid,
                parkingid: carModel.parkingid,
                isapproved: carModel.isapproved,
                createdAt: carModel.createdAt,
                updatedAt: carModel.updatedAt,
                parkingDistance: sql<number>`
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingTable.lat})) * 
                        cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingTable.lat}))
                    )) as parking_distance
                `,
                parkingName: parkingTable.name,
                parkingLocation: parkingTable.locality,
                parkingCity: parkingTable.city,
                parkingState: parkingTable.state
            })
            .from(carModel)
            .innerJoin(parkingTable, sql`${carModel.parkingid} = ${parkingTable.id}`)
            .where(and(sql`
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingTable.lat})) * 
                    cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingTable.lat}))
                )) <= ${radius}
            `, eq(carModel.isavailable, true)))
            .orderBy(sql`parking_distance`);

        if (cars.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No cars found in nearby parking areas"));
        }

        return res.status(200).json(new ApiResponse(200, cars, "Nearby cars fetched successfully"));
    } catch (error) {
        console.log(error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to fetch nearby cars");
    }
});


export const getNearestPopularCars = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = 500 } = req.body; // radius in kilometers, default 500km
    
    try {
        // Validate input coordinates
        if (!lat || !lng) {
            throw new ApiError(400, "Latitude and longitude are required");
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            throw new ApiError(400, "Invalid coordinates provided");
        }

        // Use a single query with JOIN to get cars from nearby parking locations
        const cars = await db
            .select({
                id: carModel.id,
                name: carModel.name,
                maker: carModel.maker,
                year: carModel.year,
                carnumber: carModel.carnumber,
                price: carModel.price,
                discountedprice: carModel.discountedprice,
                color: carModel.color,
                transmission: carModel.transmission,
                fuel: carModel.fuel,
                type: carModel.type,
                seats: carModel.seats,
                rcnumber: carModel.rcnumber,
                rcimg: carModel.rcimg,
                pollutionimg: carModel.pollutionimg,
                insuranceimg: carModel.insuranceimg,
                inmaintainance: carModel.inmaintainance,
                isavailable: carModel.isavailable,
                images: carModel.images,
                mainimg: carModel.mainimg,
                vendorid: carModel.vendorid,
                parkingid: carModel.parkingid,
                isapproved: carModel.isapproved,
                createdAt: carModel.createdAt,
                updatedAt: carModel.updatedAt,
                parkingDistance: sql<number>`
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingTable.lat})) * 
                        cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingTable.lat}))
                    )) as parking_distance
                `,
                parkingName: parkingTable.name,
                parkingLocation: parkingTable.locality,
                parkingCity: parkingTable.city,
                parkingState: parkingTable.state
            })
            .from(carModel)
            .innerJoin(parkingTable, sql`${carModel.parkingid} = ${parkingTable.id}`)
            .where(and(sql`
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingTable.lat})) * 
                    cos(radians(${parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingTable.lat}))
                )) <= ${radius}
            `, eq(carModel.ispopular, true)))
            .orderBy(sql`parking_distance`);

        if (cars.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No cars found in nearby parking areas"));
        }

        return res.status(200).json(new ApiResponse(200, cars, "Nearby cars fetched successfully"));
    } catch (error) {
        console.log(error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to fetch nearby cars");
    }
});


export const getCarById = asyncHandler(async (req: Request, res: Response) => {
    try {
        // First, let's try without relations to see if the basic query works
        const car = await db.select().from(carModel).where(eq(carModel.id, parseInt(req.params.id))).limit(1);
        
        if (!car || car.length === 0) {
            throw new ApiError(404, "Car not found");
        }
        
        return res.status(200).json(new ApiResponse(200, car[0], "Car fetched successfully"));
    } catch (error) {
        console.log(error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to fetch car");
    }
});

// search purpose

export const searchbynameornumber = asyncHandler(async (req: Request, res: Response) => {
    try {
        const search = req.body.search?.toLowerCase() || "";
        const car = await db
            .select()
            .from(carModel)
            .where(
                or(
                    like(sql`lower(${carModel.name})`, `%${search}%`),
                    like(sql`lower(${carModel.carnumber})`, `%${search}%`)
                )
            );

        if(car.length === 0){
            return res.status(200).json(new ApiResponse(200, [], "No car found"));
        }

        return res.status(200).json(new ApiResponse(200, car, "Car fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch car");
    }
});


export const getCarByAvailable = asyncHandler(async (req: Request, res: Response) => {
    try {
        const car = await db.select().from(carModel).where(eq(carModel.isavailable, true));
        return res.status(200).json(new ApiResponse(200, car, "Car fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch car");
    }
});

export const getCarByType = asyncHandler(async (req: Request, res: Response) => {
    try {
        const car = await db.select().from(carModel).where(eq(carModel.type, req.body.type));
        return res.status(200).json(new ApiResponse(200, car, "Car fetched successfully"));
    } catch (error) {
        throw new ApiError(500, "Failed to fetch car");
    }
});






// for admin purpose

export const createCar = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
        if (
            req.user &&
            (req.user.role === "vendor" ||
                req.user.role === "admin" ||
                req.user.role === "parkingincharge")
        ) {
            // Validate that req.body exists and has required fields
            if (!req.body || Object.keys(req.body).length === 0) {
                throw new ApiError(400, "Request body is required");
            }

            const car = await db.insert(carModel).values(req.body).returning();
            
            return res.status(200).json(new ApiResponse(200, car, "Car added successfully"));
        } else {
            throw new ApiError(403, "You are not authorized to add car");
        }
    } catch (error) {
        console.log(error);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to add car");
    }
});

export const updateCar = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
        if (
            req.user &&
            (req.user.role === "vendor" ||
                req.user.role === "admin" ||
                req.user.role === "parkingincharge")
        ) {
            const car = await db.update(carModel).set(req.body).where(eq(carModel.id, parseInt(req.params.id))).returning();
            return res.status(200).json(new ApiResponse(200, car, "Car updated successfully"));
        } else {
            throw new ApiError(403, "You are not authorized to update car");
        }
    } catch (error) {
        throw new ApiError(500, "Failed to update car");
    }
});

export const getCarByIdforadmin = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
        if (
            req.user &&
            (req.user.role === "vendor" ||
                req.user.role === "admin" ||
                req.user.role === "parkingincharge")
        ) {
            // First, let's try without relations to see if the basic query works
            const car = await db.select().from(carModel).where(eq(carModel.id, parseInt(req.params.id))).limit(1);
            
            if (!car || car.length === 0) {
                throw new ApiError(404, "Car not found");
            }
            
            return res.status(200).json(new ApiResponse(200, car[0], "Car fetched successfully"));
        } else {
            throw new ApiError(403, "You are not authorized to fetch car with all details");
        }
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, "Failed to fetch car");
    }
});

export const deletecar = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
        if (
            req.user &&
            (req.user.role === "admin")
        ) {
            const car = await db.delete(carModel).where(eq(carModel.id, parseInt(req.params.id)));
            return res.status(200).json(new ApiResponse(200, car, "Car deleted successfully"));
        } else {
            throw new ApiError(403, "You are not authorized to delete car");
        }
    } catch (error) {
        throw new ApiError(500, "Failed to delete car");
    }
});




export const getCarByApproved = asyncHandler(async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
        if (
            req.user &&
            (req.user.role === "admin")
        ) {
            const car = await db.select().from(carModel).where(eq(carModel.isapproved, true));
            return res.status(200).json(new ApiResponse(200, car, "Car fetched successfully"));
        } else {
            throw new ApiError(403, "You are not authorized to fetch car");
        }
    } catch (error) {
        throw new ApiError(500, "Failed to fetch car");
    }
});