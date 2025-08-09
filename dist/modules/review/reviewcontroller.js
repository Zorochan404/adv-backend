"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletereview = exports.updatereview = exports.getreviews = exports.getreviewsbycars = exports.getavgratingbycars = exports.addreview = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../drizzle/db");
const asyncHandler_1 = require("../utils/asyncHandler");
const reviewmodel_1 = require("./reviewmodel");
const apiError_1 = require("../utils/apiError");
const responseHandler_1 = require("../utils/responseHandler");
const dbErrorHandler_1 = require("../utils/dbErrorHandler");
const drizzle_orm_2 = require("drizzle-orm");
exports.addreview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { rating, comment } = req.body;
    const { carid } = req.params;
    const userid = req.user?.id;
    if (!userid) {
        throw apiError_1.ApiError.unauthorized("User not authenticated");
    }
    if (!rating || !comment) {
        throw apiError_1.ApiError.badRequest("Rating and comment are required");
    }
    // Validate rating range (assuming 1-5 scale)
    if (rating < 1 || rating > 5) {
        throw apiError_1.ApiError.badRequest("Rating must be between 1 and 5");
    }
    const review = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Check if user has already reviewed this car
        const existingReview = await db_1.db
            .select()
            .from(reviewmodel_1.reviewModel)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.carid, parseInt(carid)), (0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.userid, userid)));
        if (existingReview.length > 0) {
            throw apiError_1.ApiError.conflict("You have already reviewed this car");
        }
        // Add the review
        const newReview = await db_1.db
            .insert(reviewmodel_1.reviewModel)
            .values({
            carid: parseInt(carid),
            userid,
            rating,
            comment,
        })
            .returning();
        // Get the populated review with user data
        const populatedReview = await db_1.db.query.reviewModel.findFirst({
            where: (0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.id, newReview[0].id),
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
        return populatedReview;
    }, "addreview");
    return (0, responseHandler_1.sendCreated)(res, review, "Review added successfully");
});
exports.getavgratingbycars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { carid } = req.params;
    if (!carid || !/^[0-9]+$/.test(carid)) {
        throw apiError_1.ApiError.badRequest("Invalid car ID");
    }
    const avgRating = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const reviews = await db_1.db
            .select()
            .from(reviewmodel_1.reviewModel)
            .where((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.carid, parseInt(carid)));
        // Safely handle possible null ratings
        const validRatings = reviews
            .map((review) => review.rating)
            .filter((rating) => rating !== null && rating !== undefined);
        return validRatings.length > 0
            ? validRatings.reduce((acc, rating) => acc + rating, 0) /
                validRatings.length
            : 0;
    }, "getavgratingbycars");
    return (0, responseHandler_1.sendSuccess)(res, { review: avgRating }, "Average rating calculated successfully");
});
exports.getreviewsbycars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { carid } = req.params;
    const { limit = 10, page = 1, sort = "createdAt", order = "desc", } = req.query;
    if (!carid || !/^[0-9]+$/.test(carid)) {
        throw apiError_1.ApiError.badRequest("Invalid car ID");
    }
    // Parse and validate query parameters
    const limitNum = Math.min(parseInt(limit) || 10, 50); // Max 50 reviews per request
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    // Validate sort field
    const allowedSortFields = ["createdAt", "updatedAt", "rating"];
    const sortField = allowedSortFields.includes(sort)
        ? sort
        : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get total count for pagination
        const totalReviews = await db_1.db
            .select({ count: (0, drizzle_orm_2.sql) `count(*)` })
            .from(reviewmodel_1.reviewModel)
            .where((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.carid, parseInt(carid)));
        const total = totalReviews[0]?.count || 0;
        // Get reviews with populated user and car data
        const reviews = await db_1.db.query.reviewModel.findMany({
            where: (0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.carid, parseInt(carid)),
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
            limit: limitNum,
            offset: offset,
            orderBy: (reviewModel, { asc, desc }) => sortOrder === "asc"
                ? asc(reviewModel[sortField])
                : desc(reviewModel[sortField]),
        });
        return { reviews, total };
    }, "getreviewsbycars");
    return (0, responseHandler_1.sendPaginated)(res, result.reviews, result.total, pageNum, limitNum, "Reviews fetched successfully");
});
exports.getreviews = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { limit = 10, page = 1, sort = "createdAt", order = "desc", } = req.query;
    // Parse and validate query parameters
    const limitNum = Math.min(parseInt(limit) || 10, 50); // Max 50 reviews per request
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limitNum;
    // Validate sort field
    const allowedSortFields = ["createdAt", "updatedAt", "rating"];
    const sortField = allowedSortFields.includes(sort)
        ? sort
        : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get total count for pagination
        const totalReviews = await db_1.db
            .select({ count: (0, drizzle_orm_2.sql) `count(*)` })
            .from(reviewmodel_1.reviewModel);
        const total = totalReviews[0]?.count || 0;
        // Get all reviews with populated user data
        const reviews = await db_1.db.query.reviewModel.findMany({
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
            limit: limitNum,
            offset: offset,
            orderBy: (reviewModel, { asc, desc }) => sortOrder === "asc"
                ? asc(reviewModel[sortField])
                : desc(reviewModel[sortField]),
        });
        return { reviews, total };
    }, "getreviews");
    return (0, responseHandler_1.sendPaginated)(res, result.reviews, result.total, pageNum, limitNum, "All reviews fetched successfully");
});
exports.updatereview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reviewid } = req.params;
    const currentUser = req.user;
    if (!currentUser) {
        throw apiError_1.ApiError.unauthorized("User not authenticated");
    }
    const { rating, comment } = req.body;
    if (!rating || !comment) {
        throw apiError_1.ApiError.badRequest("Rating and comment are required");
    }
    // Validate rating range
    if (rating < 1 || rating > 5) {
        throw apiError_1.ApiError.badRequest("Rating must be between 1 and 5");
    }
    const review = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const singlereview = await db_1.db
            .select()
            .from(reviewmodel_1.reviewModel)
            .where((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.id, parseInt(reviewid)));
        if (singlereview.length === 0) {
            throw apiError_1.ApiError.notFound("Review not found");
        }
        const reviewToUpdate = singlereview[0];
        // Check if user can update the review (admin or review owner)
        if (currentUser.role === "admin" ||
            currentUser.id === reviewToUpdate.userid) {
            await db_1.db
                .update(reviewmodel_1.reviewModel)
                .set({ rating, comment })
                .where((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.id, parseInt(reviewid)));
            // Get the updated review with populated user data
            const updatedReview = await db_1.db.query.reviewModel.findFirst({
                where: (0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.id, parseInt(reviewid)),
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
            return updatedReview;
        }
        else {
            throw apiError_1.ApiError.forbidden("You are not authorized to update this review");
        }
    }, "updatereview");
    return (0, responseHandler_1.sendUpdated)(res, review, "Review updated successfully");
});
exports.deletereview = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { reviewid } = req.params;
    const currentUser = req.user;
    if (!currentUser) {
        throw apiError_1.ApiError.unauthorized("User not authenticated");
    }
    await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get the review to check ownership
        const singlereview = await db_1.db
            .select()
            .from(reviewmodel_1.reviewModel)
            .where((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.id, parseInt(reviewid)));
        if (singlereview.length === 0) {
            throw apiError_1.ApiError.notFound("Review not found");
        }
        const reviewToDelete = singlereview[0];
        // Check if user can delete the review (admin or review owner)
        if (currentUser.role === "admin" ||
            currentUser.id === reviewToDelete.userid) {
            await db_1.db
                .delete(reviewmodel_1.reviewModel)
                .where((0, drizzle_orm_1.eq)(reviewmodel_1.reviewModel.id, parseInt(reviewid)));
        }
        else {
            throw apiError_1.ApiError.forbidden("You are not authorized to delete this review");
        }
    }, "deletereview");
    return (0, responseHandler_1.sendDeleted)(res, "Review deleted successfully");
});
//# sourceMappingURL=reviewcontroller.js.map