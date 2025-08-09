"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePICOrAdmin = exports.requireVendorOrAdmin = exports.requireOwnerOrAdmin = exports.requireRole = exports.requireUser = exports.requirePIC = exports.requireVendor = exports.requireAdmin = exports.verifyJWT = void 0;
const apiError_1 = require("../utils/apiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const usermodel_1 = require("../user/usermodel");
const db_1 = require("../../drizzle/db");
const drizzle_orm_1 = require("drizzle-orm");
exports.verifyJWT = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken ||
            req.headers["authorization"]?.replace("Bearer ", "");
        if (!token) {
            throw new apiError_1.ApiError(401, "Unauthorized request");
        }
        if (!process.env.ACCESS_TOKEN_SECRET) {
            throw new apiError_1.ApiError(500, "Server misconfiguration: missing ACCESS_TOKEN_SECRET");
        }
        let decodedToken;
        try {
            decodedToken = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        }
        catch (err) {
            throw new apiError_1.ApiError(401, "Invalid or expired access token");
        }
        if (!decodedToken ||
            typeof decodedToken !== "object" ||
            !("_id" in decodedToken)) {
            throw new apiError_1.ApiError(401, "Invalid access token payload");
        }
        const user = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, decodedToken._id))
            // exclude password and refreshToken
            .limit(1)
            .then((rows) => rows[0]);
        if (!user) {
            throw new apiError_1.ApiError(401, "Invalid Access Token");
        }
        // Attach user to request in a type-safe way
        req.user = user;
        next();
    }
    catch (error) {
        throw new apiError_1.ApiError(401, error?.message || "Invalid access token");
    }
});
// Role-based middleware functions
exports.requireAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "admin") {
            throw new apiError_1.ApiError(403, "Admin access required");
        }
        next();
    }
    catch (error) {
        throw new apiError_1.ApiError(403, error?.message || "Admin access required");
    }
});
exports.requireVendor = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "vendor") {
            throw new apiError_1.ApiError(403, "Vendor access required");
        }
        next();
    }
    catch (error) {
        throw new apiError_1.ApiError(403, error?.message || "Vendor access required");
    }
});
exports.requirePIC = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "parkingincharge") {
            throw new apiError_1.ApiError(403, "Parking In Charge access required");
        }
        next();
    }
    catch (error) {
        throw new apiError_1.ApiError(403, error?.message || "Parking In Charge access required");
    }
});
exports.requireUser = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || user.role !== "user") {
            throw new apiError_1.ApiError(403, "User access required");
        }
        next();
    }
    catch (error) {
        throw new apiError_1.ApiError(403, error?.message || "User access required");
    }
});
// Multi-role middleware
const requireRole = (allowedRoles) => {
    return (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
        try {
            const user = req.user;
            if (!user || !allowedRoles.includes(user.role)) {
                throw new apiError_1.ApiError(403, `Access denied. Required roles: ${allowedRoles.join(", ")}`);
            }
            next();
        }
        catch (error) {
            throw new apiError_1.ApiError(403, error?.message || "Access denied");
        }
    });
};
exports.requireRole = requireRole;
// Owner or Admin middleware (for users to access their own data or admin to access any)
exports.requireOwnerOrAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res, next) => {
    try {
        const user = req.user;
        const resourceUserId = parseInt(req.params.userId || req.params.id);
        if (!user) {
            throw new apiError_1.ApiError(401, "Authentication required");
        }
        // Admin can access any resource
        if (user.role === "admin") {
            return next();
        }
        // Users can only access their own resources
        if (user.id !== resourceUserId) {
            throw new apiError_1.ApiError(403, "You can only access your own resources");
        }
        next();
    }
    catch (error) {
        throw new apiError_1.ApiError(403, error?.message || "Access denied");
    }
});
// Vendor or Admin middleware
exports.requireVendorOrAdmin = (0, exports.requireRole)(["vendor", "admin"]);
// PIC or Admin middleware
exports.requirePICOrAdmin = (0, exports.requireRole)(["parkingincharge", "admin"]);
//# sourceMappingURL=auth.js.map