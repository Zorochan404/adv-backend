"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTopup = exports.updateTopup = exports.getAllTopups = exports.getBookingTopups = exports.applyTopupToBooking = exports.getActiveTopups = exports.createTopup = void 0;
const db_1 = require("../../drizzle/db");
const topupmodel_1 = require("./topupmodel");
const bookingmodel_1 = require("./bookingmodel");
const asyncHandler_1 = require("../utils/asyncHandler");
const apiError_1 = require("../utils/apiError");
const drizzle_orm_1 = require("drizzle-orm");
const responseHandler_1 = require("../utils/responseHandler");
const dbErrorHandler_1 = require("../utils/dbErrorHandler");
// Create topup (Admin only)
exports.createTopup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can create topups");
    }
    const { name, description, duration, price, category } = req.body;
    if (!name || !duration || !price) {
        throw apiError_1.ApiError.badRequest("Name, duration, and price are required");
    }
    const topup = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const newTopup = await db_1.db
            .insert(topupmodel_1.topupTable)
            .values({
            name,
            description,
            duration: parseInt(duration),
            price: parseFloat(price),
            category: category || "extension",
            createdBy: req.user.id,
        })
            .returning();
        return newTopup[0];
    }, "createTopup");
    return (0, responseHandler_1.sendCreated)(res, topup, "Topup created successfully");
});
// Get all active topups
exports.getActiveTopups = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const topups = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        return await db_1.db
            .select()
            .from(topupmodel_1.topupTable)
            .where((0, drizzle_orm_1.eq)(topupmodel_1.topupTable.isActive, true))
            .orderBy((0, drizzle_orm_1.desc)(topupmodel_1.topupTable.createdAt));
    }, "getActiveTopups");
    return (0, responseHandler_1.sendList)(res, topups, topups.length, "Active topups fetched successfully");
});
// Apply topup to booking
exports.applyTopupToBooking = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId, topupId, paymentReferenceId } = req.body;
    if (!bookingId || !topupId || !paymentReferenceId) {
        throw apiError_1.ApiError.badRequest("Booking ID, topup ID, and payment reference ID are required");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get booking details
        const booking = await db_1.db.query.bookingsTable.findFirst({
            where: (bookingsTable, { eq }) => eq(bookingsTable.id, bookingId),
        });
        if (!booking) {
            throw apiError_1.ApiError.notFound("Booking not found");
        }
        if (booking.userId !== req.user.id) {
            throw apiError_1.ApiError.forbidden("You can only apply topups to your own bookings");
        }
        // Get topup details
        const topup = await db_1.db
            .select()
            .from(topupmodel_1.topupTable)
            .where((0, drizzle_orm_1.eq)(topupmodel_1.topupTable.id, topupId))
            .limit(1);
        if (!topup || topup.length === 0) {
            throw apiError_1.ApiError.notFound("Topup not found");
        }
        if (!topup[0].isActive) {
            throw apiError_1.ApiError.badRequest("This topup is not active");
        }
        // Calculate new end date
        const originalEndDate = new Date(booking.endDate);
        const extensionTime = topup[0].duration; // in hours
        const newEndDate = new Date(originalEndDate.getTime() + extensionTime * 60 * 60 * 1000);
        // Create booking-topup relationship
        const bookingTopup = await db_1.db
            .insert(topupmodel_1.bookingTopupTable)
            .values({
            bookingId: bookingId,
            topupId: topupId,
            appliedAt: new Date(),
            originalEndDate: originalEndDate,
            newEndDate: newEndDate,
            amount: topup[0].price,
            paymentStatus: "paid",
            paymentReferenceId: paymentReferenceId,
        })
            .returning();
        // Update booking with new end date and extension details
        const updatedBooking = await db_1.db
            .update(bookingmodel_1.bookingsTable)
            .set({
            endDate: newEndDate,
            extensionPrice: topup[0].price,
            extensionTill: newEndDate,
            extensionTime: extensionTime,
        })
            .where((0, drizzle_orm_1.eq)(bookingmodel_1.bookingsTable.id, bookingId))
            .returning();
        return {
            bookingTopup: bookingTopup[0],
            updatedBooking: updatedBooking[0],
            topup: topup[0],
        };
    }, "applyTopupToBooking");
    return (0, responseHandler_1.sendSuccess)(res, result, "Topup applied successfully");
});
// Get topups for a specific booking
exports.getBookingTopups = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { bookingId } = req.params;
    if (!bookingId || !/^[0-9]+$/.test(bookingId)) {
        throw apiError_1.ApiError.badRequest("Invalid booking ID");
    }
    const topups = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        return await db_1.db.query.bookingTopupTable.findMany({
            where: (bookingTopupTable, { eq }) => eq(bookingTopupTable.bookingId, parseInt(bookingId)),
            with: {
                topup: true,
            },
        });
    }, "getBookingTopups");
    return (0, responseHandler_1.sendList)(res, topups, topups.length, "Booking topups fetched successfully");
});
// Get all topups (Admin only)
exports.getAllTopups = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can view all topups");
    }
    const topups = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        return await db_1.db
            .select()
            .from(topupmodel_1.topupTable)
            .orderBy((0, drizzle_orm_1.desc)(topupmodel_1.topupTable.createdAt));
    }, "getAllTopups");
    return (0, responseHandler_1.sendList)(res, topups, topups.length, "All topups fetched successfully");
});
// Update topup (Admin only)
exports.updateTopup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can update topups");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid topup ID");
    }
    const topup = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const updatedTopup = await db_1.db
            .update(topupmodel_1.topupTable)
            .set({
            ...req.body,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(topupmodel_1.topupTable.id, parseInt(id)))
            .returning();
        if (!updatedTopup || updatedTopup.length === 0) {
            throw apiError_1.ApiError.notFound("Topup not found");
        }
        return updatedTopup[0];
    }, "updateTopup");
    return (0, responseHandler_1.sendUpdated)(res, topup, "Topup updated successfully");
});
// Delete topup (Admin only)
exports.deleteTopup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can delete topups");
    }
    const { id } = req.params;
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid topup ID");
    }
    await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const deletedTopup = await db_1.db
            .delete(topupmodel_1.topupTable)
            .where((0, drizzle_orm_1.eq)(topupmodel_1.topupTable.id, parseInt(id)))
            .returning();
        if (!deletedTopup || deletedTopup.length === 0) {
            throw apiError_1.ApiError.notFound("Topup not found");
        }
    }, "deleteTopup");
    return (0, responseHandler_1.sendDeleted)(res, "Topup deleted successfully");
});
//# sourceMappingURL=topupcontroller.js.map