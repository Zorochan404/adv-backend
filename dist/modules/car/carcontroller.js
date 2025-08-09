"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterCars = exports.deleteCar = exports.updateCar = exports.createCar = exports.getCarById = exports.searchbynameornumber = exports.getCarByParkingId = exports.getNearestPopularCars = exports.getNearestAvailableCars = exports.getNearestCars = exports.getCar = exports.testCarConnection = void 0;
const carmodel_1 = require("./carmodel");
const db_1 = require("../../drizzle/db");
const apiError_1 = require("../utils/apiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const drizzle_orm_1 = require("drizzle-orm");
const reviewmodel_1 = require("../review/reviewmodel");
const parkingmodel_1 = require("../parking/parkingmodel");
const responseHandler_1 = require("../utils/responseHandler");
const dbErrorHandler_1 = require("../utils/dbErrorHandler");
// Test function to verify database connection
exports.testCarConnection = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Simple count query to test connection
        return await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(carmodel_1.carModel);
    }, "testCarConnection");
    return (0, responseHandler_1.sendSuccess)(res, result[0], "Database connection successful");
});
exports.getCar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const cars = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        return await db_1.db.select().from(carmodel_1.carModel);
    }, "getCar");
    return (0, responseHandler_1.sendList)(res, cars, cars.length, "Cars fetched successfully");
});
exports.getNearestCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Support both GET (query params) and POST (body)
    const { lat, lng, radius = 500, limit = 10, page = 1, } = req.method === "GET" ? req.query : req.body;
    // Validate input coordinates
    if (!lat || !lng) {
        throw apiError_1.ApiError.badRequest("Latitude and longitude are required");
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw apiError_1.ApiError.badRequest("Invalid coordinates provided");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get total count first
        const totalCountQuery = db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(carmodel_1.carModel)
            .innerJoin(parkingmodel_1.parkingTable, (0, drizzle_orm_1.sql) `${carmodel_1.carModel.parkingid} = ${parkingmodel_1.parkingTable.id}`)
            .where((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `);
        const totalCountResult = await totalCountQuery;
        const total = totalCountResult[0]?.count || 0;
        // Get paginated results
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const cars = await db_1.db
            .select({
            id: carmodel_1.carModel.id,
            name: carmodel_1.carModel.name,
            number: carmodel_1.carModel.number,
            price: carmodel_1.carModel.price,
            discountprice: carmodel_1.carModel.discountprice,
            color: carmodel_1.carModel.color,
            inmaintainance: carmodel_1.carModel.inmaintainance,
            isavailable: carmodel_1.carModel.isavailable,
            rcnumber: carmodel_1.carModel.rcnumber,
            rcimg: carmodel_1.carModel.rcimg,
            pollutionimg: carmodel_1.carModel.pollutionimg,
            insuranceimg: carmodel_1.carModel.insuranceimg,
            images: carmodel_1.carModel.images,
            vendorid: carmodel_1.carModel.vendorid,
            parkingid: carmodel_1.carModel.parkingid,
            status: carmodel_1.carModel.status,
            createdAt: carmodel_1.carModel.createdAt,
            updatedAt: carmodel_1.carModel.updatedAt,
            parkingDistance: (0, drizzle_orm_1.sql) `
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingmodel_1.parkingTable.lat}))
                    )) as parking_distance
                `,
            parkingName: parkingmodel_1.parkingTable.name,
            parkingLocation: parkingmodel_1.parkingTable.locality,
            parkingCity: parkingmodel_1.parkingTable.city,
            parkingState: parkingmodel_1.parkingTable.state,
        })
            .from(carmodel_1.carModel)
            .innerJoin(parkingmodel_1.parkingTable, (0, drizzle_orm_1.sql) `${carmodel_1.carModel.parkingid} = ${parkingmodel_1.parkingTable.id}`)
            .where((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `)
            .orderBy((0, drizzle_orm_1.sql) `parking_distance`)
            .limit(parseInt(limit))
            .offset(offset);
        return { cars, total };
    }, "getNearestCars");
    return (0, responseHandler_1.sendPaginated)(res, result.cars, result.total, parseInt(page), parseInt(limit), "Nearest cars fetched successfully");
});
exports.getNearestAvailableCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Support both GET (query params) and POST (body)
    const { lat, lng, radius = 500, limit = 10, page = 1, } = req.method === "GET" ? req.query : req.body;
    // Validate input coordinates
    if (!lat || !lng) {
        throw apiError_1.ApiError.badRequest("Latitude and longitude are required");
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw apiError_1.ApiError.badRequest("Invalid coordinates provided");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get total count first
        const totalCountQuery = db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(carmodel_1.carModel)
            .innerJoin(parkingmodel_1.parkingTable, (0, drizzle_orm_1.sql) `${carmodel_1.carModel.parkingid} = ${parkingmodel_1.parkingTable.id}`)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `, (0, drizzle_orm_1.eq)(carmodel_1.carModel.isavailable, true), (0, drizzle_orm_1.eq)(carmodel_1.carModel.inmaintainance, false)));
        const totalCountResult = await totalCountQuery;
        const total = totalCountResult[0]?.count || 0;
        // Get paginated results
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const cars = await db_1.db
            .select({
            id: carmodel_1.carModel.id,
            name: carmodel_1.carModel.name,
            number: carmodel_1.carModel.number,
            price: carmodel_1.carModel.price,
            discountprice: carmodel_1.carModel.discountprice,
            color: carmodel_1.carModel.color,
            inmaintainance: carmodel_1.carModel.inmaintainance,
            isavailable: carmodel_1.carModel.isavailable,
            rcnumber: carmodel_1.carModel.rcnumber,
            rcimg: carmodel_1.carModel.rcimg,
            pollutionimg: carmodel_1.carModel.pollutionimg,
            insuranceimg: carmodel_1.carModel.insuranceimg,
            images: carmodel_1.carModel.images,
            vendorid: carmodel_1.carModel.vendorid,
            parkingid: carmodel_1.carModel.parkingid,
            status: carmodel_1.carModel.status,
            createdAt: carmodel_1.carModel.createdAt,
            updatedAt: carmodel_1.carModel.updatedAt,
            parkingDistance: (0, drizzle_orm_1.sql) `
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingmodel_1.parkingTable.lat}))
                    )) as parking_distance
                `,
            parkingName: parkingmodel_1.parkingTable.name,
            parkingLocation: parkingmodel_1.parkingTable.locality,
            parkingCity: parkingmodel_1.parkingTable.city,
            parkingState: parkingmodel_1.parkingTable.state,
        })
            .from(carmodel_1.carModel)
            .innerJoin(parkingmodel_1.parkingTable, (0, drizzle_orm_1.sql) `${carmodel_1.carModel.parkingid} = ${parkingmodel_1.parkingTable.id}`)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `, (0, drizzle_orm_1.eq)(carmodel_1.carModel.isavailable, true), (0, drizzle_orm_1.eq)(carmodel_1.carModel.inmaintainance, false)))
            .orderBy((0, drizzle_orm_1.sql) `parking_distance`)
            .limit(parseInt(limit))
            .offset(offset);
        return { cars, total };
    }, "getNearestAvailableCars");
    return (0, responseHandler_1.sendPaginated)(res, result.cars, result.total, parseInt(page), parseInt(limit), "Nearest available cars fetched successfully");
});
exports.getNearestPopularCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Support both GET (query params) and POST (body)
    const { lat, lng, radius = 500, limit = 3, page = 1, } = req.method === "GET" ? req.query : req.body;
    // Validate input coordinates
    if (!lat || !lng) {
        throw apiError_1.ApiError.badRequest("Latitude and longitude are required");
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw apiError_1.ApiError.badRequest("Invalid coordinates provided");
    }
    const limitNum = Math.min(parseInt(limit) || 3, 50);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get total count for pagination
        const totalCount = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(distinct ${carmodel_1.carModel.id})` })
            .from(carmodel_1.carModel)
            .innerJoin(parkingmodel_1.parkingTable, (0, drizzle_orm_1.sql) `${carmodel_1.carModel.parkingid} = ${parkingmodel_1.parkingTable.id}`)
            .leftJoin(reviewmodel_1.reviewModel, (0, drizzle_orm_1.eq)(carmodel_1.carModel.id, reviewmodel_1.reviewModel.carid))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `, (0, drizzle_orm_1.eq)(carmodel_1.carModel.isavailable, true), (0, drizzle_orm_1.eq)(carmodel_1.carModel.inmaintainance, false)));
        const total = totalCount[0]?.count || 0;
        // Get popular cars with catalog data - ordered by review count and average rating
        const cars = await db_1.db
            .select({
            id: carmodel_1.carModel.id,
            name: carmodel_1.carModel.name,
            number: carmodel_1.carModel.number,
            price: carmodel_1.carModel.price,
            discountprice: carmodel_1.carModel.discountprice,
            color: carmodel_1.carModel.color,
            inmaintainance: carmodel_1.carModel.inmaintainance,
            isavailable: carmodel_1.carModel.isavailable,
            rcnumber: carmodel_1.carModel.rcnumber,
            rcimg: carmodel_1.carModel.rcimg,
            pollutionimg: carmodel_1.carModel.pollutionimg,
            insuranceimg: carmodel_1.carModel.insuranceimg,
            images: carmodel_1.carModel.images,
            vendorid: carmodel_1.carModel.vendorid,
            parkingid: carmodel_1.carModel.parkingid,
            status: carmodel_1.carModel.status,
            createdAt: carmodel_1.carModel.createdAt,
            updatedAt: carmodel_1.carModel.updatedAt,
            parkingDistance: (0, drizzle_orm_1.sql) `
                    (6371 * acos(
                        cos(radians(${lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                        cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                        sin(radians(${lat})) * 
                        sin(radians(${parkingmodel_1.parkingTable.lat}))
                    )) as parking_distance
                `,
            parkingName: parkingmodel_1.parkingTable.name,
            parkingLocation: parkingmodel_1.parkingTable.locality,
            parkingCity: parkingmodel_1.parkingTable.city,
            parkingState: parkingmodel_1.parkingTable.state,
            // Catalog data
            maker: carmodel_1.carCatalogTable.carMaker,
            year: carmodel_1.carCatalogTable.carModelYear,
            engineCapacity: carmodel_1.carCatalogTable.engineCapacity,
            mileage: carmodel_1.carCatalogTable.mileage,
            features: carmodel_1.carCatalogTable.features,
            transmission: carmodel_1.carCatalogTable.transmission,
            fuel: carmodel_1.carCatalogTable.fuelType,
            seats: carmodel_1.carCatalogTable.seats,
            // Popularity metrics
            reviewCount: (0, drizzle_orm_1.sql) `count(${reviewmodel_1.reviewModel.id})`,
            averageRating: (0, drizzle_orm_1.sql) `avg(${reviewmodel_1.reviewModel.rating})`,
        })
            .from(carmodel_1.carModel)
            .innerJoin(parkingmodel_1.parkingTable, (0, drizzle_orm_1.sql) `${carmodel_1.carModel.parkingid} = ${parkingmodel_1.parkingTable.id}`)
            .leftJoin(carmodel_1.carCatalogTable, (0, drizzle_orm_1.eq)(carmodel_1.carModel.catalogId, carmodel_1.carCatalogTable.id))
            .leftJoin(reviewmodel_1.reviewModel, (0, drizzle_orm_1.eq)(carmodel_1.carModel.id, reviewmodel_1.reviewModel.carid))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `
                (6371 * acos(
                    cos(radians(${lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lat})) * 
                    cos(radians(${parkingmodel_1.parkingTable.lng}) - radians(${lng})) + 
                    sin(radians(${lat})) * 
                    sin(radians(${parkingmodel_1.parkingTable.lat}))
                )) <= ${radius}
            `, (0, drizzle_orm_1.eq)(carmodel_1.carModel.isavailable, true), (0, drizzle_orm_1.eq)(carmodel_1.carModel.inmaintainance, false)))
            .groupBy(carmodel_1.carModel.id, carmodel_1.carModel.name, carmodel_1.carModel.number, carmodel_1.carModel.price, carmodel_1.carModel.discountprice, carmodel_1.carModel.color, carmodel_1.carModel.inmaintainance, carmodel_1.carModel.isavailable, carmodel_1.carModel.rcnumber, carmodel_1.carModel.rcimg, carmodel_1.carModel.pollutionimg, carmodel_1.carModel.insuranceimg, carmodel_1.carModel.images, carmodel_1.carModel.vendorid, carmodel_1.carModel.parkingid, carmodel_1.carModel.status, carmodel_1.carModel.createdAt, carmodel_1.carModel.updatedAt, parkingmodel_1.parkingTable.name, parkingmodel_1.parkingTable.locality, parkingmodel_1.parkingTable.city, parkingmodel_1.parkingTable.state, parkingmodel_1.parkingTable.lat, parkingmodel_1.parkingTable.lng, carmodel_1.carCatalogTable.carMaker, carmodel_1.carCatalogTable.carModelYear, carmodel_1.carCatalogTable.engineCapacity, carmodel_1.carCatalogTable.mileage, carmodel_1.carCatalogTable.features, carmodel_1.carCatalogTable.transmission, carmodel_1.carCatalogTable.fuelType, carmodel_1.carCatalogTable.seats)
            .orderBy((0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `count(${reviewmodel_1.reviewModel.id})`), (0, drizzle_orm_1.desc)((0, drizzle_orm_1.sql) `avg(${reviewmodel_1.reviewModel.rating})`), (0, drizzle_orm_1.sql) `parking_distance`)
            .limit(limitNum)
            .offset(offset);
        return { cars, total };
    }, "getNearestPopularCars");
    return (0, responseHandler_1.sendPaginated)(res, result.cars, result.total, pageNum, limitNum, "Nearest popular cars fetched successfully");
});
exports.getCarByParkingId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { limit = 10, page = 1 } = req.query;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get total count for pagination
        const totalCount = await db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(carmodel_1.carModel)
            .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.parkingid, parseInt(id)));
        const total = totalCount[0]?.count || 0;
        // Get cars with catalog data
        const cars = await db_1.db
            .select({
            id: carmodel_1.carModel.id,
            name: carmodel_1.carModel.name,
            number: carmodel_1.carModel.number,
            price: carmodel_1.carModel.price,
            discountprice: carmodel_1.carModel.discountprice,
            color: carmodel_1.carModel.color,
            inmaintainance: carmodel_1.carModel.inmaintainance,
            isavailable: carmodel_1.carModel.isavailable,
            rcnumber: carmodel_1.carModel.rcnumber,
            rcimg: carmodel_1.carModel.rcimg,
            pollutionimg: carmodel_1.carModel.pollutionimg,
            insuranceimg: carmodel_1.carModel.insuranceimg,
            images: carmodel_1.carModel.images,
            vendorid: carmodel_1.carModel.vendorid,
            parkingid: carmodel_1.carModel.parkingid,
            status: carmodel_1.carModel.status,
            createdAt: carmodel_1.carModel.createdAt,
            updatedAt: carmodel_1.carModel.updatedAt,
            // Catalog data
            maker: carmodel_1.carCatalogTable.carMaker,
            year: carmodel_1.carCatalogTable.carModelYear,
            engineCapacity: carmodel_1.carCatalogTable.engineCapacity,
            mileage: carmodel_1.carCatalogTable.mileage,
            features: carmodel_1.carCatalogTable.features,
            transmission: carmodel_1.carCatalogTable.transmission,
            fuel: carmodel_1.carCatalogTable.fuelType,
            seats: carmodel_1.carCatalogTable.seats,
        })
            .from(carmodel_1.carModel)
            .leftJoin(carmodel_1.carCatalogTable, (0, drizzle_orm_1.eq)(carmodel_1.carModel.catalogId, carmodel_1.carCatalogTable.id))
            .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.parkingid, parseInt(id)))
            .limit(limitNum)
            .offset(offset);
        return { cars, total };
    }, "getCarByParkingId");
    return (0, responseHandler_1.sendPaginated)(res, result.cars, result.total, pageNum, limitNum, "Cars by parking ID fetched successfully");
});
exports.searchbynameornumber = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // Support both GET (query params) and POST (body)
    const search = req.query.search || req.body?.search;
    if (!search) {
        throw apiError_1.ApiError.badRequest("Search term is required");
    }
    const cars = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        return await db_1.db
            .select({
            id: carmodel_1.carModel.id,
            name: carmodel_1.carModel.name,
            number: carmodel_1.carModel.number,
            price: carmodel_1.carModel.price,
            discountprice: carmodel_1.carModel.discountprice,
            color: carmodel_1.carModel.color,
            inmaintainance: carmodel_1.carModel.inmaintainance,
            isavailable: carmodel_1.carModel.isavailable,
            rcnumber: carmodel_1.carModel.rcnumber,
            rcimg: carmodel_1.carModel.rcimg,
            pollutionimg: carmodel_1.carModel.pollutionimg,
            insuranceimg: carmodel_1.carModel.insuranceimg,
            images: carmodel_1.carModel.images,
            vendorid: carmodel_1.carModel.vendorid,
            parkingid: carmodel_1.carModel.parkingid,
            status: carmodel_1.carModel.status,
            createdAt: carmodel_1.carModel.createdAt,
            updatedAt: carmodel_1.carModel.updatedAt,
            // Catalog data
            maker: carmodel_1.carCatalogTable.carMaker,
            year: carmodel_1.carCatalogTable.carModelYear,
            engineCapacity: carmodel_1.carCatalogTable.engineCapacity,
            mileage: carmodel_1.carCatalogTable.mileage,
            features: carmodel_1.carCatalogTable.features,
            transmission: carmodel_1.carCatalogTable.transmission,
            fuel: carmodel_1.carCatalogTable.fuelType,
            seats: carmodel_1.carCatalogTable.seats,
        })
            .from(carmodel_1.carModel)
            .leftJoin(carmodel_1.carCatalogTable, (0, drizzle_orm_1.eq)(carmodel_1.carModel.catalogId, carmodel_1.carCatalogTable.id))
            .where((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(carmodel_1.carModel.name, `%${search}%`), (0, drizzle_orm_1.like)(carmodel_1.carModel.number, `%${search}%`)));
    }, "searchbynameornumber");
    return (0, responseHandler_1.sendList)(res, cars, cars.length, "Cars found successfully");
});
exports.getCarById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid car ID");
    }
    const car = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get car with catalog data
        const carData = await db_1.db
            .select({
            id: carmodel_1.carModel.id,
            name: carmodel_1.carModel.name,
            number: carmodel_1.carModel.number,
            price: carmodel_1.carModel.price,
            discountprice: carmodel_1.carModel.discountprice,
            color: carmodel_1.carModel.color,
            inmaintainance: carmodel_1.carModel.inmaintainance,
            isavailable: carmodel_1.carModel.isavailable,
            rcnumber: carmodel_1.carModel.rcnumber,
            rcimg: carmodel_1.carModel.rcimg,
            pollutionimg: carmodel_1.carModel.pollutionimg,
            insuranceimg: carmodel_1.carModel.insuranceimg,
            images: carmodel_1.carModel.images,
            vendorid: carmodel_1.carModel.vendorid,
            parkingid: carmodel_1.carModel.parkingid,
            status: carmodel_1.carModel.status,
            createdAt: carmodel_1.carModel.createdAt,
            updatedAt: carmodel_1.carModel.updatedAt,
            // Catalog data
            maker: carmodel_1.carCatalogTable.carMaker,
            year: carmodel_1.carCatalogTable.carModelYear,
            engineCapacity: carmodel_1.carCatalogTable.engineCapacity,
            mileage: carmodel_1.carCatalogTable.mileage,
            features: carmodel_1.carCatalogTable.features,
            transmission: carmodel_1.carCatalogTable.transmission,
            fuel: carmodel_1.carCatalogTable.fuelType,
            seats: carmodel_1.carCatalogTable.seats,
        })
            .from(carmodel_1.carModel)
            .leftJoin(carmodel_1.carCatalogTable, (0, drizzle_orm_1.eq)(carmodel_1.carModel.catalogId, carmodel_1.carCatalogTable.id))
            .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, parseInt(id)))
            .limit(1);
        if (!carData || carData.length === 0) {
            throw apiError_1.ApiError.notFound("Car not found");
        }
        const car = carData[0];
        // Get parking details
        const parking = await db_1.db
            .select()
            .from(parkingmodel_1.parkingTable)
            .where((0, drizzle_orm_1.eq)(parkingmodel_1.parkingTable.id, car.parkingid))
            .limit(1);
        // Get reviews for this car
        const reviews = await db_1.db
            .select()
            .from(reviewmodel_1.reviewModel)
            .where((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.carid, parseInt(id)));
        // Calculate average rating
        const validRatings = reviews
            .map((review) => review.rating)
            .filter((rating) => rating !== null && rating !== undefined);
        const avgRating = validRatings.length > 0
            ? validRatings.reduce((acc, rating) => acc + rating, 0) /
                validRatings.length
            : 0;
        // Get user details for reviews
        const reviewsWithUsers = await db_1.db.query.reviewModel.findMany({
            where: (0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.carid, parseInt(id)),
            with: {
                user: {
                    columns: {
                        id: true,
                        name: true,
                        avatar: true,
                        email: true,
                        number: true,
                        role: true,
                        isverified: true,
                        createdAt: true,
                    },
                },
            },
        });
        return {
            carId: car.id,
            carName: car.name,
            parkingName: parking[0]?.name || "Unknown",
            overallRating: avgRating,
            totalReviews: reviews.length,
            fuel: car.fuel || "Unknown",
            transmission: car.transmission || "Unknown",
            seats: car.seats || 5,
            lat: parking[0]?.lat || 0,
            lng: parking[0]?.lng || 0,
            customerReviews: reviewsWithUsers.map((review) => ({
                name: review.user?.name || "Anonymous",
                comment: review.comment,
                rating: review.rating,
            })),
            pricingPerDay: car.discountprice || car.price || 0,
            offeredPrice: car.discountprice || car.price || 0,
            imageUrl: car.images?.[0] || null,
            carNumber: car.number,
        };
    }, "getCarById");
    return (0, responseHandler_1.sendItem)(res, car, "Car fetched successfully");
});
exports.createCar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    console.log(`🚗 [CREATE_CAR] Starting car creation...`);
    console.log(`🚗 [CREATE_CAR] Request ID: ${req.headers["x-request-id"] || "none"}`);
    console.log(`🚗 [CREATE_CAR] User: ${req.user?.id}, Role: ${req.user?.role}`);
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "vendor")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to create cars");
    }
    // Check if headers have already been sent (prevent double response)
    if (res.headersSent) {
        console.log(`🚗 [CREATE_CAR] Headers already sent, skipping...`);
        return;
    }
    // Add request deduplication check
    const requestId = `${req.user.id || "unknown"}-${req.body.number}-${Date.now()}`;
    console.log(`🚗 [CREATE_CAR] Creating car with request ID: ${requestId}`);
    const car = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        console.log(`🚗 [CREATE_CAR] Database operation starting...`);
        // Check if car with same number already exists
        const existingCar = await db_1.db
            .select()
            .from(carmodel_1.carModel)
            .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.number, req.body.number))
            .limit(1);
        if (existingCar.length > 0) {
            throw apiError_1.ApiError.conflict(`Car with number ${req.body.number} already exists`);
        }
        const newCar = await db_1.db.insert(carmodel_1.carModel).values(req.body).returning();
        console.log(`🚗 [CREATE_CAR] Database operation completed. Car ID: ${newCar[0]?.id}`);
        return newCar[0];
    }, "createCar");
    console.log(`🚗 [CREATE_CAR] Sending response...`);
    return (0, responseHandler_1.sendCreated)(res, car, "Car created successfully");
});
exports.updateCar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const requestId = `${req.user?.id || "unknown"}-${req.params.id}-${Date.now()}`;
    console.log(`🚗 [UPDATE_CAR] Starting update for car ${req.params.id}, Request ID: ${requestId}`);
    // Check if headers have already been sent (prevent double response)
    if (res.headersSent) {
        console.log(`🚗 [UPDATE_CAR] Headers already sent, skipping... Request ID: ${requestId}`);
        return;
    }
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "vendor")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to update cars");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid car ID");
    }
    // Check if request body is empty
    if (!req.body || Object.keys(req.body).length === 0) {
        throw apiError_1.ApiError.badRequest("Update data is required");
    }
    console.log(`🚗 [UPDATE_CAR] Processing update data:`, req.body);
    try {
        // First check if car exists
        const existingCar = await db_1.db
            .select()
            .from(carmodel_1.carModel)
            .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, parseInt(id)))
            .limit(1);
        if (!existingCar || existingCar.length === 0) {
            throw apiError_1.ApiError.notFound("Car not found");
        }
        // Separate car fields from catalog fields
        const carFields = [
            "name",
            "number",
            "vendorid",
            "parkingid",
            "color",
            "price",
            "discountprice",
            "inmaintainance",
            "isavailable",
            "rcnumber",
            "rcimg",
            "pollutionimg",
            "insuranceimg",
            "images",
            "catalogId",
            "status",
        ];
        const catalogFields = [
            "transmission",
            "fuel",
            "seats",
            "maker",
            "year",
            "engineCapacity",
            "mileage",
            "features",
            "category",
        ];
        const carUpdateData = Object.keys(req.body)
            .filter((key) => carFields.includes(key))
            .reduce((obj, key) => {
            obj[key] = req.body[key];
            return obj;
        }, {});
        const catalogUpdateData = Object.keys(req.body)
            .filter((key) => catalogFields.includes(key))
            .reduce((obj, key) => {
            // Map frontend field names to catalog field names
            const fieldMapping = {
                transmission: "transmission",
                fuel: "fuelType",
                seats: "seats",
                maker: "carMaker",
                year: "carModelYear",
                engineCapacity: "engineCapacity",
                mileage: "mileage",
                features: "features",
                category: "category",
            };
            obj[fieldMapping[key]] = req.body[key];
            return obj;
        }, {});
        // If updating car number, check for duplicates
        if (carUpdateData.number &&
            carUpdateData.number !== existingCar[0].number) {
            const duplicateCar = await db_1.db
                .select()
                .from(carmodel_1.carModel)
                .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.number, carUpdateData.number))
                .limit(1);
            if (duplicateCar.length > 0) {
                throw apiError_1.ApiError.conflict(`Car with number ${carUpdateData.number} already exists`);
            }
        }
        // Update car fields if any
        let updatedCar = existingCar[0];
        if (Object.keys(carUpdateData).length > 0) {
            const carResult = await db_1.db
                .update(carmodel_1.carModel)
                .set(carUpdateData)
                .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, parseInt(id)))
                .returning();
            if (!carResult || carResult.length === 0) {
                throw apiError_1.ApiError.notFound("Car not found");
            }
            updatedCar = carResult[0];
        }
        // Update catalog fields if any
        if (Object.keys(catalogUpdateData).length > 0) {
            if (!updatedCar.catalogId) {
                throw apiError_1.ApiError.badRequest("Cannot update catalog fields: car has no catalog association");
            }
            await db_1.db
                .update(carmodel_1.carCatalogTable)
                .set(catalogUpdateData)
                .where((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.id, updatedCar.catalogId));
        }
        console.log(`🚗 [UPDATE_CAR] Sending response for Request ID: ${requestId}`);
        return (0, responseHandler_1.sendUpdated)(res, updatedCar, "Car updated successfully");
    }
    catch (error) {
        console.error(`🚗 [UPDATE_CAR] Database error:`, error);
        // Handle specific database errors
        if (error.code === "23505") {
            throw apiError_1.ApiError.conflict("Duplicate field value");
        }
        if (error.code === "23503") {
            throw apiError_1.ApiError.badRequest("Referenced record not found");
        }
        if (error.code === "22P02") {
            throw apiError_1.ApiError.badRequest("Invalid ID format");
        }
        // If it's already an ApiError, re-throw it
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        // For other database errors, throw generic error
        throw apiError_1.ApiError.internal("Database operation failed");
    }
});
exports.deleteCar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "vendor")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to delete cars");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid car ID");
    }
    await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const deletedCar = await db_1.db
            .delete(carmodel_1.carModel)
            .where((0, drizzle_orm_1.eq)(carmodel_1.carModel.id, parseInt(id)))
            .returning();
        if (!deletedCar || deletedCar.length === 0) {
            throw apiError_1.ApiError.notFound("Car not found");
        }
    }, "deleteCar");
    return (0, responseHandler_1.sendDeleted)(res, "Car deleted successfully");
});
exports.filterCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const filters = req.query;
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Build where conditions dynamically
        const conditions = [];
        // Basic car fields
        if (filters.name) {
            conditions.push((0, drizzle_orm_1.like)(carmodel_1.carModel.name, `%${filters.name}%`));
        }
        if (filters.number) {
            conditions.push((0, drizzle_orm_1.like)(carmodel_1.carModel.number, `%${filters.number}%`));
        }
        if (filters.color) {
            conditions.push((0, drizzle_orm_1.like)(carmodel_1.carModel.color, `%${filters.color}%`));
        }
        if (filters.status) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carModel.status, filters.status));
        }
        if (filters.price_min) {
            conditions.push((0, drizzle_orm_1.gte)(carmodel_1.carModel.price, parseInt(filters.price_min)));
        }
        if (filters.price_max) {
            conditions.push((0, drizzle_orm_1.lte)(carmodel_1.carModel.price, parseInt(filters.price_max)));
        }
        if (filters.discountprice_min) {
            conditions.push((0, drizzle_orm_1.gte)(carmodel_1.carModel.discountprice, parseInt(filters.discountprice_min)));
        }
        if (filters.discountprice_max) {
            conditions.push((0, drizzle_orm_1.lte)(carmodel_1.carModel.discountprice, parseInt(filters.discountprice_max)));
        }
        if (filters.parkingid) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carModel.parkingid, parseInt(filters.parkingid)));
        }
        if (filters.vendorid) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carModel.vendorid, parseInt(filters.vendorid)));
        }
        // Catalog fields
        if (filters.maker) {
            conditions.push((0, drizzle_orm_1.like)(carmodel_1.carCatalogTable.carMaker, `%${filters.maker}%`));
        }
        if (filters.year) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.carModelYear, parseInt(filters.year)));
        }
        if (filters.transmission) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.transmission, filters.transmission));
        }
        if (filters.fuel) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.fuelType, filters.fuel));
        }
        if (filters.seats) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.seats, parseInt(filters.seats)));
        }
        if (filters.category) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.category, filters.category));
        }
        // Get total count first
        const totalCountQuery = db_1.db
            .select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(carmodel_1.carModel)
            .leftJoin(carmodel_1.carCatalogTable, (0, drizzle_orm_1.eq)(carmodel_1.carModel.catalogId, carmodel_1.carCatalogTable.id));
        const totalCountResult = conditions.length > 0
            ? await totalCountQuery.where((0, drizzle_orm_1.and)(...conditions))
            : await totalCountQuery;
        const total = totalCountResult[0]?.count || 0;
        // Get paginated results
        const limit = parseInt(filters.limit) || 10;
        const page = parseInt(filters.page) || 1;
        const offset = (page - 1) * limit; // Fixed offset calculation
        const carsQuery = db_1.db
            .select({
            id: carmodel_1.carModel.id,
            name: carmodel_1.carModel.name,
            number: carmodel_1.carModel.number,
            price: carmodel_1.carModel.price,
            discountprice: carmodel_1.carModel.discountprice,
            color: carmodel_1.carModel.color,
            inmaintainance: carmodel_1.carModel.inmaintainance,
            isavailable: carmodel_1.carModel.isavailable,
            rcnumber: carmodel_1.carModel.rcnumber,
            rcimg: carmodel_1.carModel.rcimg,
            pollutionimg: carmodel_1.carModel.pollutionimg,
            insuranceimg: carmodel_1.carModel.insuranceimg,
            images: carmodel_1.carModel.images,
            vendorid: carmodel_1.carModel.vendorid,
            parkingid: carmodel_1.carModel.parkingid,
            status: carmodel_1.carModel.status,
            createdAt: carmodel_1.carModel.createdAt,
            updatedAt: carmodel_1.carModel.updatedAt,
            // Catalog data
            maker: carmodel_1.carCatalogTable.carMaker,
            year: carmodel_1.carCatalogTable.carModelYear,
            engineCapacity: carmodel_1.carCatalogTable.engineCapacity,
            mileage: carmodel_1.carCatalogTable.mileage,
            features: carmodel_1.carCatalogTable.features,
            transmission: carmodel_1.carCatalogTable.transmission,
            fuel: carmodel_1.carCatalogTable.fuelType,
            seats: carmodel_1.carCatalogTable.seats,
            category: carmodel_1.carCatalogTable.category,
        })
            .from(carmodel_1.carModel)
            .leftJoin(carmodel_1.carCatalogTable, (0, drizzle_orm_1.eq)(carmodel_1.carModel.catalogId, carmodel_1.carCatalogTable.id))
            .orderBy((0, drizzle_orm_1.desc)(carmodel_1.carModel.createdAt))
            .limit(limit)
            .offset(offset);
        const cars = conditions.length > 0
            ? await carsQuery.where((0, drizzle_orm_1.and)(...conditions))
            : await carsQuery;
        return { cars, total };
    }, "filterCars");
    const limit = parseInt(filters.limit) || 10;
    const page = parseInt(filters.page) || 1;
    return (0, responseHandler_1.sendPaginated)(res, result.cars, result.total, page, limit, "Cars filtered successfully");
});
//# sourceMappingURL=carcontroller.js.map