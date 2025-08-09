"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdvertisementStats = exports.incrementClickCount = exports.incrementViewCount = exports.getActiveAdvertisements = exports.deleteAdvertisement = exports.updateAdvertisement = exports.getAdvertisementById = exports.getAllAdvertisements = exports.createAdvertisement = void 0;
const db_1 = require("../../drizzle/db");
const advertisementmodel_1 = require("./advertisementmodel");
const apiError_1 = require("../utils/apiError");
const apiResponse_1 = require("../utils/apiResponse");
const asyncHandler_1 = require("../utils/asyncHandler");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_orm_2 = require("drizzle-orm");
// Create new advertisement
exports.createAdvertisement = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        // Check if user is authorized (admin or vendor)
        if (!req.user ||
            (req.user.role !== "admin" && req.user.role !== "vendor")) {
            throw new apiError_1.ApiError(403, "You are not authorized to create advertisements");
        }
        const { title, description, imageUrl, videoUrl, linkUrl, adType, priority, startDate, endDate, targetAudience, location, } = req.body;
        // Validate required fields
        if (!title || !imageUrl || !startDate || !endDate) {
            throw new apiError_1.ApiError(400, "Title, image URL, start date, and end date are required");
        }
        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const currentDate = new Date();
        if (start >= end) {
            throw new apiError_1.ApiError(400, "End date must be after start date");
        }
        // Allow start dates in the past but not too far back (within last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(currentDate.getDate() - 30);
        if (start < thirtyDaysAgo) {
            throw new apiError_1.ApiError(400, "Start date cannot be more than 30 days in the past");
        }
        const advertisement = await db_1.db
            .insert(advertisementmodel_1.advertisementTable)
            .values({
            title,
            description,
            imageUrl,
            videoUrl,
            linkUrl,
            adType: adType || "banner",
            priority: priority || 1,
            startDate: new Date(start),
            endDate: new Date(end),
            targetAudience: targetAudience || "all",
            location: location || "homepage",
            createdBy: req.user.id,
        })
            .returning();
        return res
            .status(201)
            .json(new apiResponse_1.ApiResponse(201, advertisement[0], "Advertisement created successfully"));
    }
    catch (error) {
        console.log(error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, "Failed to create advertisement");
    }
});
// Get all advertisements (admin only)
exports.getAllAdvertisements = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            throw new apiError_1.ApiError(403, "You are not authorized to view all advertisements");
        }
        const { limit = 10, page = 1, status, adType, sort = "createdAt", order = "desc", } = req.query;
        // Parse and validate query parameters
        const limitNum = Math.min(parseInt(limit) || 10, 50);
        const pageNum = Math.max(parseInt(page) || 1, 1);
        const offset = (pageNum - 1) * limitNum;
        // Build where conditions
        const conditions = [];
        if (status)
            conditions.push((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.status, status));
        if (adType)
            conditions.push((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.adType, adType));
        // Get total count
        const totalAds = await db_1.db
            .select({ count: (0, drizzle_orm_2.sql) `count(*)` })
            .from(advertisementmodel_1.advertisementTable)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined);
        const total = totalAds[0]?.count || 0;
        // Get advertisements with pagination
        const advertisements = await db_1.db
            .select()
            .from(advertisementmodel_1.advertisementTable)
            .where(conditions.length > 0 ? (0, drizzle_orm_1.and)(...conditions) : undefined)
            .limit(limitNum)
            .offset(offset)
            .orderBy(order === "asc"
            ? (0, drizzle_orm_1.asc)(advertisementmodel_1.advertisementTable.createdAt)
            : (0, drizzle_orm_1.desc)(advertisementmodel_1.advertisementTable.createdAt));
        // Calculate pagination info
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;
        const response = {
            advertisements,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalAds: total,
                limit: limitNum,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? pageNum + 1 : null,
                prevPage: hasPrevPage ? pageNum - 1 : null,
            },
        };
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, response, "Advertisements fetched successfully"));
    }
    catch (error) {
        console.log(error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, "Failed to fetch advertisements");
    }
});
// Get advertisement by ID
exports.getAdvertisementById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        const advertisement = await db_1.db
            .select()
            .from(advertisementmodel_1.advertisementTable)
            .where((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.id, parseInt(id)))
            .limit(1);
        if (!advertisement || advertisement.length === 0) {
            throw new apiError_1.ApiError(404, "Advertisement not found");
        }
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, advertisement[0], "Advertisement fetched successfully"));
    }
    catch (error) {
        console.log(error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, "Failed to fetch advertisement");
    }
});
// Update advertisement
exports.updateAdvertisement = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user ||
            (req.user.role !== "admin" && req.user.role !== "vendor")) {
            throw new apiError_1.ApiError(403, "You are not authorized to update advertisements");
        }
        const advertisement = await db_1.db
            .select()
            .from(advertisementmodel_1.advertisementTable)
            .where((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.id, parseInt(id)))
            .limit(1);
        if (!advertisement || advertisement.length === 0) {
            throw new apiError_1.ApiError(404, "Advertisement not found");
        }
        // Only admin can update any ad, vendors can only update their own ads
        if (req.user.role !== "admin" &&
            advertisement[0].createdBy !== req.user.id) {
            throw new apiError_1.ApiError(403, "You can only update your own advertisements");
        }
        const updateData = { ...req.body };
        // Handle date fields properly
        if (updateData.startDate) {
            updateData.startDate = new Date(updateData.startDate);
        }
        if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
        }
        // Validate dates if provided
        if (updateData.startDate && updateData.endDate) {
            const start = new Date(updateData.startDate);
            const end = new Date(updateData.endDate);
            const currentDate = new Date();
            if (start >= end) {
                throw new apiError_1.ApiError(400, "End date must be after start date");
            }
            // Allow start dates in the past but not too far back (within last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(currentDate.getDate() - 30);
            if (start < thirtyDaysAgo) {
                throw new apiError_1.ApiError(400, "Start date cannot be more than 30 days in the past");
            }
        }
        const updatedAdvertisement = await db_1.db
            .update(advertisementmodel_1.advertisementTable)
            .set({
            ...updateData,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.id, parseInt(id)))
            .returning();
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, updatedAdvertisement[0], "Advertisement updated successfully"));
    }
    catch (error) {
        console.log(error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, "Failed to update advertisement");
    }
});
// Delete advertisement
exports.deleteAdvertisement = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.user ||
            (req.user.role !== "admin" && req.user.role !== "vendor")) {
            throw new apiError_1.ApiError(403, "You are not authorized to delete advertisements");
        }
        const advertisement = await db_1.db
            .select()
            .from(advertisementmodel_1.advertisementTable)
            .where((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.id, parseInt(id)))
            .limit(1);
        if (!advertisement || advertisement.length === 0) {
            throw new apiError_1.ApiError(404, "Advertisement not found");
        }
        // Only admin can delete any ad, vendors can only delete their own ads
        if (req.user.role !== "admin" &&
            advertisement[0].createdBy !== req.user.id) {
            throw new apiError_1.ApiError(403, "You can only delete your own advertisements");
        }
        await db_1.db
            .delete(advertisementmodel_1.advertisementTable)
            .where((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.id, parseInt(id)));
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, null, "Advertisement deleted successfully"));
    }
    catch (error) {
        console.log(error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, "Failed to delete advertisement");
    }
});
// Get active advertisements for carousel (public endpoint)
exports.getActiveAdvertisements = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { adType = "carousel", location = "homepage", limit = 5, } = req.query;
        const limitNum = Math.min(parseInt(limit) || 5, 20);
        const currentDate = new Date();
        // Allow advertisements that are currently active or scheduled to start within the next 30 days
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
        const advertisements = await db_1.db
            .select({
            id: advertisementmodel_1.advertisementTable.id,
            title: advertisementmodel_1.advertisementTable.title,
            description: advertisementmodel_1.advertisementTable.description,
            imageUrl: advertisementmodel_1.advertisementTable.imageUrl,
            videoUrl: advertisementmodel_1.advertisementTable.videoUrl,
            linkUrl: advertisementmodel_1.advertisementTable.linkUrl,
            adType: advertisementmodel_1.advertisementTable.adType,
            priority: advertisementmodel_1.advertisementTable.priority,
        })
            .from(advertisementmodel_1.advertisementTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.status, "active"), (0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.isActive, true), (0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.adType, adType), (0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.location, location), (0, drizzle_orm_1.lte)(advertisementmodel_1.advertisementTable.startDate, thirtyDaysFromNow), // Allow ads starting within next 30 days
        (0, drizzle_orm_1.gte)(advertisementmodel_1.advertisementTable.endDate, currentDate) // Must not have ended yet
        ))
            .orderBy((0, drizzle_orm_1.desc)(advertisementmodel_1.advertisementTable.priority), (0, drizzle_orm_1.desc)(advertisementmodel_1.advertisementTable.createdAt))
            .limit(limitNum);
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, advertisements, "Active advertisements fetched successfully"));
    }
    catch (error) {
        console.log(error);
        throw new apiError_1.ApiError(500, "Failed to fetch active advertisements");
    }
});
// Increment view count
exports.incrementViewCount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.db
            .update(advertisementmodel_1.advertisementTable)
            .set({
            viewCount: (0, drizzle_orm_2.sql) `${advertisementmodel_1.advertisementTable.viewCount} + 1`,
        })
            .where((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.id, parseInt(id)));
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, null, "View count incremented"));
    }
    catch (error) {
        console.log(error);
        throw new apiError_1.ApiError(500, "Failed to increment view count");
    }
});
// Increment click count
exports.incrementClickCount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        const { id } = req.params;
        await db_1.db
            .update(advertisementmodel_1.advertisementTable)
            .set({
            clickCount: (0, drizzle_orm_2.sql) `${advertisementmodel_1.advertisementTable.clickCount} + 1`,
        })
            .where((0, drizzle_orm_1.eq)(advertisementmodel_1.advertisementTable.id, parseInt(id)));
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, null, "Click count incremented"));
    }
    catch (error) {
        console.log(error);
        throw new apiError_1.ApiError(500, "Failed to increment click count");
    }
});
// Get advertisement statistics (admin only)
exports.getAdvertisementStats = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            throw new apiError_1.ApiError(403, "You are not authorized to view advertisement statistics");
        }
        const stats = await db_1.db
            .select({
            totalAds: (0, drizzle_orm_2.sql) `count(*)`,
            activeAds: (0, drizzle_orm_2.sql) `count(*) filter (where status = 'active')`,
            pendingAds: (0, drizzle_orm_2.sql) `count(*) filter (where status = 'pending')`,
            totalViews: (0, drizzle_orm_2.sql) `sum(view_count)`,
            totalClicks: (0, drizzle_orm_2.sql) `sum(click_count)`,
        })
            .from(advertisementmodel_1.advertisementTable);
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse(200, stats[0], "Advertisement statistics fetched successfully"));
    }
    catch (error) {
        console.log(error);
        if (error instanceof apiError_1.ApiError) {
            throw error;
        }
        throw new apiError_1.ApiError(500, "Failed to fetch advertisement statistics");
    }
});
//# sourceMappingURL=advertisementcontroller.js.map