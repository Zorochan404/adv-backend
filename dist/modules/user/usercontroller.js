"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.getParkingInchargeByParkingId = exports.assignParkingIncharge = exports.getParkingInchargeByNumber = exports.addvendor = exports.getusersbyvendor = exports.addParkingIncharge = exports.getUserbyrole = exports.searchUser = exports.getAllUsers = exports.deleteUser = exports.updateUser = exports.getUser = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const db_1 = require("../../drizzle/db");
const usermodel_1 = require("./usermodel");
const drizzle_orm_1 = require("drizzle-orm");
const apiError_1 = require("../utils/apiError");
const responseHandler_1 = require("../utils/responseHandler");
const dbErrorHandler_1 = require("../utils/dbErrorHandler");
const drizzle_orm_2 = require("drizzle-orm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
exports.getUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid user ID");
    }
    const user = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const foundUser = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, Number(id)));
        if (!foundUser || foundUser.length === 0) {
            throw apiError_1.ApiError.notFound("User not found");
        }
        // Remove password from user object
        const { password, ...userWithoutPassword } = foundUser[0];
        return userWithoutPassword;
    }, "getUser");
    return (0, responseHandler_1.sendItem)(res, user, "User fetched successfully");
});
exports.updateUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { id: _id, password: _password, ...updateData } = req.body;
    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid user ID");
    }
    // Check if user is trying to set isverified to true (only admins can do this)
    const currentUser = req.user;
    if (updateData.isverified === true && currentUser.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can verify user accounts");
    }
    const user = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const updatedUser = await db_1.db
            .update(usermodel_1.UserTable)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, Number(id)))
            .returning();
        if (!updatedUser || updatedUser.length === 0) {
            throw apiError_1.ApiError.notFound("User not found");
        }
        // Remove password from user object
        const { password, ...userWithoutPassword } = updatedUser[0];
        return userWithoutPassword;
    }, "updateUser");
    return (0, responseHandler_1.sendUpdated)(res, user, "User updated successfully");
});
exports.deleteUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate ID
    if (!id || !/^[0-9]+$/.test(id)) {
        throw apiError_1.ApiError.badRequest("Invalid user ID");
    }
    await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const deletedUser = await db_1.db
            .delete(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, Number(id)))
            .returning();
        if (!deletedUser || deletedUser.length === 0) {
            throw apiError_1.ApiError.notFound("User not found");
        }
    }, "deleteUser");
    return (0, responseHandler_1.sendDeleted)(res, "User deleted successfully");
});
exports.getAllUsers = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const users = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const allUsers = await db_1.db.select().from(usermodel_1.UserTable);
        // Remove password from each user object
        return allUsers.map(({ password, ...user }) => user);
    }, "getAllUsers");
    return (0, responseHandler_1.sendList)(res, users, users.length, "All users fetched successfully");
});
exports.searchUser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const queryParams = req.query;
    // Extract pagination parameters
    const page = parseInt(queryParams.page) || 1;
    const limit = parseInt(queryParams.limit) || 10;
    const offset = (page - 1) * limit;
    // If no query parameters provided, return all users with pagination
    if (!queryParams ||
        Object.keys(queryParams).length === 0 ||
        (Object.keys(queryParams).length === 1 &&
            (queryParams.page || queryParams.limit))) {
        const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
            // Get total count
            const totalCount = await db_1.db
                .select({ count: (0, drizzle_orm_2.sql) `count(*)` })
                .from(usermodel_1.UserTable);
            const total = totalCount[0]?.count || 0;
            // Get paginated users
            const users = await db_1.db
                .select()
                .from(usermodel_1.UserTable)
                .limit(limit)
                .offset(offset);
            return {
                users: users.map(({ password, ...user }) => user),
                total,
            };
        }, "searchUser");
        return (0, responseHandler_1.sendPaginated)(res, result.users, result.total, page, limit, "All users fetched successfully");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const conditions = [];
        // Build filter conditions based on provided query parameters
        Object.keys(queryParams).forEach((key) => {
            const value = queryParams[key];
            if (value && key !== "page" && key !== "limit") {
                switch (key.toLowerCase()) {
                    case "name":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.name})`, `%${value.toLowerCase()}%`));
                        break;
                    case "email":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.email})`, `%${value.toLowerCase()}%`));
                        break;
                    case "number":
                    case "phone":
                        const phoneNum = Number(value);
                        if (!isNaN(phoneNum)) {
                            conditions.push((0, drizzle_orm_1.eq)(usermodel_1.UserTable.number, phoneNum));
                        }
                        break;
                    case "role":
                        if (["user", "admin", "vendor", "parkingincharge"].includes(value)) {
                            conditions.push((0, drizzle_orm_1.eq)(usermodel_1.UserTable.role, value));
                        }
                        break;
                    case "city":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.city})`, `%${value.toLowerCase()}%`));
                        break;
                    case "state":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.state})`, `%${value.toLowerCase()}%`));
                        break;
                    case "country":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.country})`, `%${value.toLowerCase()}%`));
                        break;
                    case "locality":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.locality})`, `%${value.toLowerCase()}%`));
                        break;
                    case "pincode":
                        const pincodeNum = Number(value);
                        if (!isNaN(pincodeNum)) {
                            conditions.push((0, drizzle_orm_1.eq)(usermodel_1.UserTable.pincode, pincodeNum));
                        }
                        break;
                    case "aadharnumber":
                    case "aadhar":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.aadharNumber})`, `%${value.toLowerCase()}%`));
                        break;
                    case "dlnumber":
                    case "dl":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.dlNumber})`, `%${value.toLowerCase()}%`));
                        break;
                    case "passportnumber":
                    case "passport":
                        conditions.push((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.passportNumber})`, `%${value.toLowerCase()}%`));
                        break;
                    case "isverified":
                        const isVerified = value.toLowerCase() === "true";
                        conditions.push((0, drizzle_orm_1.eq)(usermodel_1.UserTable.isverified, isVerified));
                        break;
                    default:
                        // For any other parameter, try to match against name, email, or number
                        conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.name})`, `%${value.toLowerCase()}%`), (0, drizzle_orm_1.like)((0, drizzle_orm_2.sql) `lower(${usermodel_1.UserTable.email})`, `%${value.toLowerCase()}%`), (0, drizzle_orm_1.eq)(usermodel_1.UserTable.number, Number(value) || 0)));
                }
            }
        });
        // If no valid conditions, return all users with pagination
        if (conditions.length === 0) {
            const totalCount = await db_1.db
                .select({ count: (0, drizzle_orm_2.sql) `count(*)` })
                .from(usermodel_1.UserTable);
            const total = totalCount[0]?.count || 0;
            const users = await db_1.db
                .select()
                .from(usermodel_1.UserTable)
                .limit(limit)
                .offset(offset);
            return {
                users: users.map(({ password, ...user }) => user),
                total,
            };
        }
        // Get total count with filters
        const totalCountQuery = await db_1.db
            .select({ count: (0, drizzle_orm_2.sql) `count(*)` })
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.and)(...conditions));
        const total = totalCountQuery[0]?.count || 0;
        // Apply all conditions with AND logic and pagination
        const foundUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.and)(...conditions))
            .limit(limit)
            .offset(offset);
        // Remove password from each user object
        return {
            users: foundUsers.map(({ password, ...user }) => user),
            total,
        };
    }, "searchUser");
    return (0, responseHandler_1.sendPaginated)(res, result.users, result.total, page, limit, "Users found successfully");
});
exports.getUserbyrole = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { role } = req.body;
    if (!role) {
        throw apiError_1.ApiError.badRequest("Role is required");
    }
    const users = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const foundUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.role, role));
        // Remove password from each user object
        return foundUsers.map(({ password, ...user }) => user);
    }, "getUserbyrole");
    return (0, responseHandler_1.sendList)(res, users, users.length, "Users fetched successfully");
});
exports.addParkingIncharge = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can add parking incharge");
    }
    const user = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const newUser = await db_1.db
            .insert(usermodel_1.UserTable)
            .values({ ...req.body, role: "parkingincharge" })
            .returning();
        // Remove password from user object
        const { password, ...userWithoutPassword } = newUser[0];
        return userWithoutPassword;
    }, "addParkingIncharge");
    return (0, responseHandler_1.sendSuccess)(res, user, "Parking incharge added successfully");
});
exports.getusersbyvendor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user ||
        (req.user.role !== "admin" && req.user.role !== "parkingincharge")) {
        throw apiError_1.ApiError.forbidden("You are not authorized to fetch users by vendor");
    }
    const users = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const foundUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.role, "vendor"));
        // Remove password from each user object
        return foundUsers.map(({ password, ...user }) => user);
    }, "getusersbyvendor");
    return (0, responseHandler_1.sendList)(res, users, users.length, "Vendor users fetched successfully");
});
exports.addvendor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const user = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const newUser = await db_1.db.insert(usermodel_1.UserTable).values(req.body).returning();
        // Remove password from user object
        const { password, ...userWithoutPassword } = newUser[0];
        return userWithoutPassword;
    }, "addvendor");
    return (0, responseHandler_1.sendSuccess)(res, user, "Vendor added successfully");
});
exports.getParkingInchargeByNumber = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("You are not authorized to fetch parking incharge by number");
    }
    const { number } = req.body;
    if (!number) {
        throw apiError_1.ApiError.badRequest("Phone number is required");
    }
    const users = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const foundUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(usermodel_1.UserTable.number, number), (0, drizzle_orm_1.eq)(usermodel_1.UserTable.role, "parkingincharge")));
        // Remove password from each user object
        return foundUsers.map(({ password, ...user }) => user);
    }, "getParkingInchargeByNumber");
    return (0, responseHandler_1.sendList)(res, users, users.length, "Parking incharge fetched successfully");
});
exports.assignParkingIncharge = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("You are not authorized to assign parking incharge");
    }
    const { id, parkingid } = req.body;
    if (!id || !parkingid) {
        throw apiError_1.ApiError.badRequest("User ID and parking ID are required");
    }
    const user = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const updatedUser = await db_1.db
            .update(usermodel_1.UserTable)
            .set({ role: "parkingincharge", parkingid: parkingid })
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, id))
            .returning();
        if (!updatedUser || updatedUser.length === 0) {
            throw apiError_1.ApiError.notFound("User not found");
        }
        // Remove password from user object
        const { password, ...userWithoutPassword } = updatedUser[0];
        return userWithoutPassword;
    }, "assignParkingIncharge");
    return (0, responseHandler_1.sendUpdated)(res, user, "Parking incharge assigned successfully");
});
exports.getParkingInchargeByParkingId = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user || req.user.role !== "admin") {
        throw apiError_1.ApiError.forbidden("You are not authorized to fetch parking incharge by parking id");
    }
    const { parkingid } = req.params;
    if (!parkingid || !/^[0-9]+$/.test(parkingid)) {
        throw apiError_1.ApiError.badRequest("Invalid parking ID");
    }
    const users = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const foundUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.parkingid, Number(parkingid)));
        // Remove password from each user object
        return foundUsers.map(({ password, ...user }) => user);
    }, "getParkingInchargeByParkingId");
    return (0, responseHandler_1.sendList)(res, users, users.length, "Parking incharge fetched successfully");
});
// Update password function
exports.updatePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    // Validate that new password and confirm password match
    if (newPassword !== confirmPassword) {
        throw apiError_1.ApiError.badRequest("New password and confirmation password do not match");
    }
    // Get current user
    const currentUser = await db_1.db
        .select()
        .from(usermodel_1.UserTable)
        .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, userId))
        .limit(1);
    if (!currentUser || currentUser.length === 0) {
        throw apiError_1.ApiError.notFound("User not found");
    }
    const user = currentUser[0];
    // Check if user has a password set
    if (!user.password) {
        throw apiError_1.ApiError.badRequest("User does not have a password set");
    }
    // Verify current password
    const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        throw apiError_1.ApiError.unauthorized("Current password is incorrect");
    }
    // Hash the new password
    const saltRounds = 12;
    const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, saltRounds);
    // Update the password
    const updatedUser = await db_1.db
        .update(usermodel_1.UserTable)
        .set({
        password: hashedNewPassword,
        updatedAt: new Date(),
    })
        .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, userId))
        .returning();
    if (!updatedUser || updatedUser.length === 0) {
        throw apiError_1.ApiError.internal("Failed to update password");
    }
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser[0];
    return (0, responseHandler_1.sendUpdated)(res, userWithoutPassword, "Password updated successfully");
});
//# sourceMappingURL=usercontroller.js.map