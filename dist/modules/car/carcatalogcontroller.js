"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCarCategories = exports.updateCarCatalogLateFees = exports.seedCarCatalog = exports.getActiveCarCatalog = exports.deleteCarCatalog = exports.updateCarCatalog = exports.getCarCatalogById = exports.getAllCarCatalog = exports.createCarCatalog = void 0;
const carmodel_1 = require("./carmodel");
const db_1 = require("../../drizzle/db");
const apiError_1 = require("../utils/apiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
const responseHandler_1 = require("../utils/responseHandler");
const dbErrorHandler_1 = require("../utils/dbErrorHandler");
// Create car catalog entry (Admin only)
exports.createCarCatalog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can create car catalog entries");
    }
    const { carName, carMaker, carModelYear, carVendorPrice, carPlatformPrice, transmission, fuelType, seats, engineCapacity, mileage, features, imageUrl, category, } = req.body;
    // Validate required fields
    if (!carName ||
        !carMaker ||
        !carModelYear ||
        !carVendorPrice ||
        !carPlatformPrice) {
        throw apiError_1.ApiError.badRequest("Missing required fields");
    }
    const catalogEntry = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const newEntry = await db_1.db
            .insert(carmodel_1.carCatalogTable)
            .values({
            carName: carName,
            carMaker: carMaker,
            carModelYear: parseInt(carModelYear),
            carVendorPrice: carVendorPrice.toString(),
            carPlatformPrice: carPlatformPrice.toString(),
            transmission: (transmission || "manual"),
            fuelType: (fuelType || "petrol"),
            seats: parseInt(seats) || 5,
            engineCapacity: engineCapacity,
            mileage: mileage,
            features: features,
            imageUrl: imageUrl,
            category: category || "sedan",
            createdBy: req.user.id,
        })
            .returning();
        return newEntry[0];
    }, "createCarCatalog");
    return (0, responseHandler_1.sendCreated)(res, catalogEntry, "Car catalog entry created successfully");
});
// Get all car catalog entries (with pagination and filtering)
exports.getAllCarCatalog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 10, page = 1, category, fuelType, transmission, isActive = "true", } = req.query;
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Build where conditions
        const conditions = [];
        if (category)
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.category, category));
        if (fuelType)
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.fuelType, fuelType));
        if (transmission)
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.transmission, transmission));
        if (isActive !== undefined) {
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.isActive, isActive === "true"));
        }
        // Get total count
        const totalCount = await db_1.db
            .select({ count: (0, drizzle_orm_2.sql) `count(*)` })
            .from(carmodel_1.carCatalogTable)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined);
        const total = totalCount[0]?.count || 0;
        // Get catalog entries
        const catalogEntries = await db_1.db
            .select()
            .from(carmodel_1.carCatalogTable)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .orderBy((0, drizzle_orm_1.desc)(carmodel_1.carCatalogTable.createdAt))
            .limit(limitNum)
            .offset(offset);
        return { catalogEntries, total };
    }, "getAllCarCatalog");
    return (0, responseHandler_1.sendPaginated)(res, result.catalogEntries, result.total, pageNum, limitNum, "Car catalog entries fetched successfully");
});
// Get car catalog entry by ID
exports.getCarCatalogById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid catalog ID");
    }
    const catalogEntry = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const foundEntry = await db_1.db
            .select()
            .from(carmodel_1.carCatalogTable)
            .where((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.id, parseInt(id)))
            .limit(1);
        if (!foundEntry || foundEntry.length === 0) {
            throw apiError_1.ApiError.notFound("Car catalog entry not found");
        }
        return foundEntry[0];
    }, "getCarCatalogById");
    return (0, responseHandler_1.sendItem)(res, catalogEntry, "Car catalog entry fetched successfully");
});
// Update car catalog entry (Admin only)
exports.updateCarCatalog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can update car catalog entries");
    }
    const { id } = req.params;
    const updateData = { ...req.body };
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid catalog ID");
    }
    // Convert numeric fields
    if (updateData.carModelYear) {
        updateData.carModelYear = parseInt(updateData.carModelYear);
    }
    if (updateData.carVendorPrice) {
        updateData.carVendorPrice = parseFloat(updateData.carVendorPrice);
    }
    if (updateData.carPlatformPrice) {
        updateData.carPlatformPrice = parseFloat(updateData.carPlatformPrice);
    }
    if (updateData.seats) {
        updateData.seats = parseInt(updateData.seats);
    }
    const updatedEntry = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const result = await db_1.db
            .update(carmodel_1.carCatalogTable)
            .set({
            ...updateData,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.id, parseInt(id)))
            .returning();
        if (!result || result.length === 0) {
            throw apiError_1.ApiError.notFound("Car catalog entry not found");
        }
        return result[0];
    }, "updateCarCatalog");
    return (0, responseHandler_1.sendUpdated)(res, updatedEntry, "Car catalog entry updated successfully");
});
// Delete car catalog entry (Admin only)
exports.deleteCarCatalog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can delete car catalog entries");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid catalog ID");
    }
    const deletedEntry = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const result = await db_1.db
            .delete(carmodel_1.carCatalogTable)
            .where((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.id, parseInt(id)))
            .returning();
        if (!result || result.length === 0) {
            throw apiError_1.ApiError.notFound("Car catalog entry not found");
        }
        return result[0];
    }, "deleteCarCatalog");
    return (0, responseHandler_1.sendDeleted)(res, "Car catalog entry deleted successfully");
});
// Get active car catalog entries for vendors
exports.getActiveCarCatalog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { category, fuelType, transmission } = req.query;
    const catalogEntries = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Build where conditions
        const conditions = [(0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.isActive, true)];
        if (category)
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.category, category));
        if (fuelType)
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.fuelType, fuelType));
        if (transmission)
            conditions.push((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.transmission, transmission));
        return await db_1.db
            .select()
            .from(carmodel_1.carCatalogTable)
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.asc)(carmodel_1.carCatalogTable.carName));
    }, "getActiveCarCatalog");
    return (0, responseHandler_1.sendList)(res, catalogEntries, catalogEntries.length, "Active car catalog entries fetched successfully");
});
// Seed car catalog data for testing (Admin only)
exports.seedCarCatalog = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can seed car catalog data");
    }
    const seedData = [
        {
            carName: "Honda City",
            carMaker: "Honda",
            carModelYear: 2023,
            carVendorPrice: "800.00",
            carPlatformPrice: "1200.00",
            transmission: "manual",
            fuelType: "petrol",
            seats: 5,
            engineCapacity: "1.5L",
            mileage: "18 kmpl",
            features: "AC, Power Steering, Music System, Airbags, Bluetooth",
            imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
            category: "sedan",
            lateFeeRate: "0.10", // 10% of daily rate per hour
        },
        {
            carName: "Maruti Swift",
            carMaker: "Maruti Suzuki",
            carModelYear: 2023,
            carVendorPrice: "600.00",
            carPlatformPrice: "900.00",
            transmission: "manual",
            fuelType: "petrol",
            seats: 5,
            engineCapacity: "1.2L",
            mileage: "22 kmpl",
            features: "AC, Power Steering, Music System, Airbags",
            imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500",
            category: "hatchback",
            lateFeeRate: "0.08", // 8% of daily rate per hour
        },
        {
            carName: "Toyota Innova Crysta",
            carMaker: "Toyota",
            carModelYear: 2023,
            carVendorPrice: "1200.00",
            carPlatformPrice: "1800.00",
            transmission: "automatic",
            fuelType: "diesel",
            seats: 7,
            engineCapacity: "2.4L",
            mileage: "12 kmpl",
            features: "AC, Power Steering, Music System, GPS, Leather Seats, Sunroof",
            imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500",
            category: "suv",
            lateFeeRate: "0.12", // 12% of daily rate per hour
        },
        {
            carName: "Hyundai i20",
            carMaker: "Hyundai",
            carModelYear: 2023,
            carVendorPrice: "700.00",
            carPlatformPrice: "1000.00",
            transmission: "manual",
            fuelType: "petrol",
            seats: 5,
            engineCapacity: "1.2L",
            mileage: "20 kmpl",
            features: "AC, Power Steering, Music System, Airbags, LED Headlamps",
            imageUrl: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500",
            category: "hatchback",
            lateFeeRate: "0.08", // 8% of daily rate per hour
        },
        {
            carName: "Mahindra XUV500",
            carMaker: "Mahindra",
            carModelYear: 2023,
            carVendorPrice: "1000.00",
            carPlatformPrice: "1500.00",
            transmission: "manual",
            fuelType: "diesel",
            seats: 7,
            engineCapacity: "2.2L",
            mileage: "15 kmpl",
            features: "AC, Power Steering, Music System, GPS, Sunroof, 4WD",
            imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
            category: "suv",
            lateFeeRate: "0.12", // 12% of daily rate per hour
        },
        {
            carName: "Kia Seltos",
            carMaker: "Kia",
            carModelYear: 2023,
            carVendorPrice: "900.00",
            carPlatformPrice: "1300.00",
            transmission: "automatic",
            fuelType: "petrol",
            seats: 5,
            engineCapacity: "1.5L",
            mileage: "16 kmpl",
            features: "AC, Power Steering, Music System, GPS, Panoramic Sunroof, LED DRLs",
            imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500",
            category: "suv",
            lateFeeRate: "0.11", // 11% of daily rate per hour
        },
        {
            carName: "Tata Nexon EV",
            carMaker: "Tata",
            carModelYear: 2023,
            carVendorPrice: "800.00",
            carPlatformPrice: "1200.00",
            transmission: "automatic",
            fuelType: "electric",
            seats: 5,
            engineCapacity: "30.2 kWh",
            mileage: "312 km range",
            features: "AC, Power Steering, Music System, GPS, Fast Charging, Regenerative Braking",
            imageUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500",
            category: "electric",
            lateFeeRate: "0.15", // 15% of daily rate per hour (higher for EVs)
        },
        {
            carName: "BMW 3 Series",
            carMaker: "BMW",
            carModelYear: 2023,
            carVendorPrice: "2000.00",
            carPlatformPrice: "3000.00",
            transmission: "automatic",
            fuelType: "petrol",
            seats: 5,
            engineCapacity: "2.0L",
            mileage: "14 kmpl",
            features: "AC, Power Steering, Music System, GPS, Leather Seats, Sport Mode, LED Headlamps",
            imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
            category: "luxury",
            lateFeeRate: "0.20", // 20% of daily rate per hour (higher for luxury cars)
        },
    ];
    const createdEntries = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const entries = [];
        for (const data of seedData) {
            const entry = await db_1.db
                .insert(carmodel_1.carCatalogTable)
                .values({
                ...data,
                createdBy: req.user.id,
            })
                .returning();
            entries.push(entry[0]);
        }
        return entries;
    }, "seedCarCatalog");
    return (0, responseHandler_1.sendCreated)(res, createdEntries, "Car catalog seeded successfully");
});
// Update existing car catalog entries with late fee rates
exports.updateCarCatalogLateFees = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can update car catalog late fees");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get all existing car catalog entries
        const existingEntries = await db_1.db.select().from(carmodel_1.carCatalogTable);
        const updatedEntries = [];
        for (const entry of existingEntries) {
            let lateFeeRate = "0.10"; // Default 10%
            // Set late fee rates based on category
            switch (entry.category) {
                case "hatchback":
                    lateFeeRate = "0.08"; // 8% for hatchbacks
                    break;
                case "sedan":
                    lateFeeRate = "0.10"; // 10% for sedans
                    break;
                case "suv":
                    lateFeeRate = "0.12"; // 12% for SUVs
                    break;
                case "electric":
                    lateFeeRate = "0.15"; // 15% for electric vehicles
                    break;
                case "luxury":
                    lateFeeRate = "0.20"; // 20% for luxury cars
                    break;
                default:
                    lateFeeRate = "0.10"; // Default 10%
            }
            // Update the entry with late fee rate
            const updatedEntry = await db_1.db
                .update(carmodel_1.carCatalogTable)
                .set({
                lateFeeRate: lateFeeRate,
                updatedAt: new Date(),
            })
                .where((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.id, entry.id))
                .returning();
            updatedEntries.push(updatedEntry[0]);
        }
        return updatedEntries;
    }, "updateCarCatalogLateFees");
    return (0, responseHandler_1.sendSuccess)(res, result, "Car catalog late fees updated successfully");
});
// Get all unique car categories
exports.getAllCarCategories = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const categories = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const result = await db_1.db
            .selectDistinct({ category: carmodel_1.carCatalogTable.category })
            .from(carmodel_1.carCatalogTable)
            .where((0, drizzle_orm_1.eq)(carmodel_1.carCatalogTable.isActive, true));
        // Extract categories and filter out null/undefined values
        const categoryList = result
            .map(item => item.category)
            .filter(category => category && category.trim() !== "");
        // Remove duplicates and sort alphabetically
        const uniqueCategories = [...new Set(categoryList)].sort();
        return uniqueCategories;
    }, "getAllCarCategories");
    return (0, responseHandler_1.sendSuccess)(res, { categories }, "Car categories retrieved successfully");
});
//# sourceMappingURL=carcatalogcontroller.js.map