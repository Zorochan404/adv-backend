"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParkingByIDadmin = exports.deleteParking = exports.updateParking = exports.createParking = exports.getParkingById = exports.getNearByParking = exports.getParkingByFilter = exports.getParking = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const db_1 = require("../../drizzle/db");
const parkingmodel_1 = require("./parkingmodel");
const apiError_1 = require("../utils/apiError");
const drizzle_orm_1 = require("drizzle-orm");
const responseHandler_1 = require("../utils/responseHandler");
const dbErrorHandler_1 = require("../utils/dbErrorHandler");
exports.getParking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const parking = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        return await db_1.db.select().from(parkingmodel_1.parkingTable);
    }, "getParking");
    return (0, responseHandler_1.sendList)(res, parking, parking.length, "Parking fetched successfully");
});
exports.getParkingByFilter = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { state, pincode, name, city, locality, country } = req.query;
    const parking = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Build dynamic where conditions based on provided filters
        const conditions = [];
        if (state) {
            conditions.push((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.state, state));
        }
        if (pincode) {
            conditions.push((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.pincode, parseInt(pincode)));
        }
        if (name) {
            conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_1.sql) `lower(${parkingmodel_1.parkingTable.name})`, `%${name.toLowerCase()}%`));
        }
        if (city) {
            conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_1.sql) `lower(${parkingmodel_1.parkingTable.city})`, `%${city.toLowerCase()}%`));
        }
        if (locality) {
            conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_1.sql) `lower(${parkingmodel_1.parkingTable.locality})`, `%${locality.toLowerCase()}%`));
        }
        if (country) {
            conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_1.sql) `lower(${parkingmodel_1.parkingTable.country})`, `%${country.toLowerCase()}%`));
        }
        // If no filters provided, return all parking
        if (conditions.length === 0) {
            return await db_1.db.select().from(parkingmodel_1.parkingTable);
        }
        // Apply filters using AND condition
        return await db_1.db
            .select()
            .from(parkingmodel_1.parkingTable)
            .where((0, drizzle_orm_1.and)(...conditions));
    }, "getParkingByFilter");
    if (parking.length === 0) {
        return (0, responseHandler_1.sendList)(res, [], 0, "No parking found with the specified filters");
    }
    return (0, responseHandler_1.sendList)(res, parking, parking.length, "Filtered parking fetched successfully");
});
exports.getNearByParking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Support both GET (query params) and POST (body)
    const { lat, lng, radius = 500, limit = 10, page = 1, } = req.method === "GET" ? req.query : req.body;
    // Validate input coordinates
    if (!lat || !lng) {
        throw apiError_1.ApiError.badRequest("Latitude and longitude are required");
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw apiError_1.ApiError.badRequest("Invalid coordinates provided");
    }
    // Parse and validate pagination parameters
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get total count first for pagination
        const totalCountQuery = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(parkingmodel_1.parkingTable)
            .where((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `);
        const total = totalCountQuery[0]?.count || 0;
        // Get paginated results
        const parking = await db_1.db
            .select({
            id: parkingmodel_1.parkingTable.id,
            name: parkingmodel_1.parkingTable.name,
            locality: parkingmodel_1.parkingTable.locality,
            city: parkingmodel_1.parkingTable.city,
            state: parkingmodel_1.parkingTable.state,
            country: parkingmodel_1.parkingTable.country,
            pincode: parkingmodel_1.parkingTable.pincode,
            capacity: parkingmodel_1.parkingTable.capacity,
            mainimg: parkingmodel_1.parkingTable.mainimg,
            images: parkingmodel_1.parkingTable.images,
            lat: parkingmodel_1.parkingTable.lat,
            lng: parkingmodel_1.parkingTable.lng,
            distance: (0, drizzle_orm_1.sql) `
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingmodel_1.parkingTable.lat}))
                    )) as distance
                `,
            createdAt: parkingmodel_1.parkingTable.createdAt,
            updatedAt: parkingmodel_1.parkingTable.updatedAt,
        })
            .from(parkingmodel_1.parkingTable)
            .where((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `)
            .orderBy((0, drizzle_orm_1.sql) `distance`)
            .limit(limitNum)
            .offset(offset);
        return { parking, total };
    }, "getNearByParking");
    if (result.parking.length === 0) {
        return (0, responseHandler_1.sendPaginated)(res, [], result.total, pageNum, limitNum, "No parking found");
    }
    return (0, responseHandler_1.sendPaginated)(res, result.parking, result.total, pageNum, limitNum, "Nearby parking fetched successfully");
});
exports.getParkingById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // First get the parking details
        const parking = await db_1.db
            .select()
            .from(parkingmodel_1.parkingTable)
            .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, parseInt(id)));
        if (parking.length === 0) {
            throw apiError_1.ApiError.notFound("Parking not found");
        }
        // Import carModel for the query
        const { carModel } = await Promise.resolve().then(() => __importStar(require("../car/carmodel")));
        // Get all cars in this parking location
        const cars = await db_1.db
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
            .where((0, drizzle_orm_1.eq)(carModel.parkingid, parseInt(id)));
        // Combine parking details with cars
        return {
            parking: parking[0],
            cars: cars,
            totalCars: cars.length,
            availableCars: cars.filter((car) => car.isavailable).length,
        };
    }, "getParkingById");
    return (0, responseHandler_1.sendItem)(res, result, "Parking with cars fetched successfully");
});
//admin
exports.createParking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "parkingincharge")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to add parking");
    }
    // Validate that req.body exists and has required fields
    if (!req.body || Object.keys(req.body).length === 0) {
        throw apiError_1.ApiError.badRequest("Request body is required");
    }
    const parking = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const newParking = await db_1.db
            .insert(parkingmodel_1.parkingTable)
            .values(req.body)
            .returning();
        return newParking[0];
    }, "createParking");
    return (0, responseHandler_1.sendCreated)(res, parking, "Parking added successfully");
});
exports.updateParking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "parkingincharge")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to update parking");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    const parking = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const updatedParking = await db_1.db
            .update(parkingmodel_1.parkingTable)
            .set(req.body)
            .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, parseInt(id)))
            .returning();
        if (!updatedParking || updatedParking.length === 0) {
            throw apiError_1.ApiError.notFound("Parking not found");
        }
        return updatedParking[0];
    }, "updateParking");
    return (0, responseHandler_1.sendUpdated)(res, parking, "Parking updated successfully");
});
exports.deleteParking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "parkingincharge")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to delete parking");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const deletedParking = await db_1.db
            .delete(parkingmodel_1.parkingTable)
            .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, parseInt(id)))
            .returning();
        if (!deletedParking || deletedParking.length === 0) {
            throw apiError_1.ApiError.notFound("Parking not found");
        }
    }, "deleteParking");
    return (0, responseHandler_1.sendDeleted)(res, "Parking deleted successfully");
});
exports.getParkingByIDadmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "parkingincharge")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to fetch parking");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get parking details
        const parking = await db_1.db
            .select()
            .from(parkingmodel_1.parkingTable)
            .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, parseInt(id)));
        if (parking.length === 0) {
            throw apiError_1.ApiError.notFound("Parking not found");
        }
        // Import required models
        const { carModel } = await Promise.resolve().then(() => __importStar(require("../car/carmodel")));
        const { UserTable } = await Promise.resolve().then(() => __importStar(require("../user/usermodel")));
        // Get parking incharge (users with parkingincharge role assigned to this parking)
        const parkingIncharge = await db_1.db
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
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(UserTable.role, "parkingincharge"), (0, drizzle_orm_1.eq)(UserTable.parkingid, parseInt(id))));
        // Get all cars in this parking location
        const cars = await db_1.db
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
            .where((0, drizzle_orm_1.eq)(carModel.parkingid, parseInt(id)));
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
    return (0, responseHandler_1.sendItem)(res, result, "Parking details with incharge and cars fetched successfully");
});
//# sourceMappingURL=parkingcontroller.js.map