"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migratePasswords = exports.loginAdmin = exports.registerAdmin = exports.loginuser = void 0;
const usermodel_1 = require("../user/usermodel");
const db_1 = require("../../drizzle/db");
const drizzle_orm_1 = require("drizzle-orm");
const apiError_1 = require("../utils/apiError");
const asyncHandler_1 = require("../utils/asyncHandler");
const responseHandler_1 = require("../utils/responseHandler");
const dbErrorHandler_1 = require("../utils/dbErrorHandler");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const drizzle_orm_2 = require("drizzle-orm");
exports.loginuser = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { number, otp, password } = req.body;
    // Validate required fields
    if (!number) {
        throw apiError_1.ApiError.badRequest("Phone number is required");
    }
    // Validate phone number format
    if (!/^[0-9]{10}$/.test(number)) {
        throw apiError_1.ApiError.badRequest("Invalid phone number format. Must be 10 digits");
    }
    // Check if user is trying to use password-based login or OTP-based login
    const isPasswordLogin = password && !otp;
    const isOtpLogin = otp && !password;
    if (!isPasswordLogin && !isOtpLogin) {
        throw apiError_1.ApiError.badRequest("Either password or OTP is required");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const existingUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.number, number));
        if (existingUsers.length === 0) {
            // User doesn't exist, create new user (only for OTP-based login)
            if (isOtpLogin) {
                const newUser = await db_1.db
                    .insert(usermodel_1.UserTable)
                    .values({
                    number: number,
                    role: "user",
                    password: otp, // Store OTP as password for new users
                })
                    .returning();
                // Generate access token for new user
                const accessToken = jsonwebtoken_1.default.sign({
                    _id: newUser[0].id,
                    number: newUser[0].number,
                    role: newUser[0].role,
                }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: "1d",
                });
                // Exclude password from user object before sending response
                const { password: _password, ...userWithoutPassword } = newUser[0];
                return {
                    user: userWithoutPassword,
                    accessToken,
                    isNewUser: true,
                };
            }
            else {
                throw apiError_1.ApiError.unauthorized("User not found");
            }
        }
        // User exists, check authentication method
        const user = existingUsers[0];
        if (isPasswordLogin) {
            // Password-based login (for admin, PIC, vendor, user with hashed passwords)
            if (!user.password) {
                throw apiError_1.ApiError.unauthorized("User does not have a password set");
            }
            // Check if password is hashed (starts with $2b$)
            if (user.password.startsWith("$2b$")) {
                // Hashed password - use bcrypt
                const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
                if (!isPasswordValid) {
                    throw apiError_1.ApiError.unauthorized("Invalid password");
                }
            }
            else {
                // Plain text password - direct comparison
                if (user.password !== password) {
                    throw apiError_1.ApiError.unauthorized("Invalid password");
                }
            }
        }
        else {
            // OTP-based login (for users and vendors)
            if (user.role === "admin" || user.role === "parkingincharge") {
                throw apiError_1.ApiError.forbidden("Admin and PIC users must use password-based login");
            }
            // Check if user has a password/OTP
            if (!user.password) {
                throw apiError_1.ApiError.unauthorized("User does not have OTP set");
            }
            // For OTP login, check if password matches OTP
            if (user.password !== otp) {
                throw apiError_1.ApiError.unauthorized("Invalid OTP");
            }
        }
        // Generate access token
        const accessToken = jsonwebtoken_1.default.sign({
            _id: user.id,
            number: user.number,
            role: user.role,
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1d",
        });
        // Exclude password from user object before sending response
        const { password: _password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
            isNewUser: false,
        };
    }, "loginuser");
    const message = result.isNewUser
        ? "User created and logged in successfully"
        : "User login successful";
    return (0, responseHandler_1.sendSuccess)(res, result, message);
});
exports.registerAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { number, password, role, name, email, parkingid, locality, city, state, country, pincode, isverified, avatar, age, aadharNumber, aadharimg, dlNumber, dlimg, passportNumber, passportimg, lat, lng, } = req.body;
    // Validate required fields
    if (!number || !password || !role) {
        throw apiError_1.ApiError.badRequest("Number, password, and role are required");
    }
    // Validate phone number format
    if (!/^[0-9]{10}$/.test(number)) {
        throw apiError_1.ApiError.badRequest("Invalid phone number format. Must be 10 digits");
    }
    // Validate role
    const validRoles = ["admin", "user", "vendor", "parkingincharge"];
    if (!validRoles.includes(role)) {
        throw apiError_1.ApiError.badRequest(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }
    const user = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const existingUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(usermodel_1.UserTable.number, number), (0, drizzle_orm_1.eq)(usermodel_1.UserTable.role, role)));
        if (existingUsers.length > 0) {
            throw apiError_1.ApiError.conflict("User with this number and role already exists");
        }
        // Hash the password
        const saltRounds = 12;
        const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
        const newUser = await db_1.db
            .insert(usermodel_1.UserTable)
            .values({
            number: number,
            password: hashedPassword,
            role: role,
            name: name || null,
            email: email || null,
            parkingid: parkingid || null,
            locality: locality || null,
            city: city || null,
            state: state || null,
            country: country || null,
            pincode: pincode || null,
            isverified: isverified || false,
            avatar: avatar || null,
            age: age || null,
            aadharNumber: aadharNumber || null,
            aadharimg: aadharimg || null,
            dlNumber: dlNumber || null,
            dlimg: dlimg || null,
            passportNumber: passportNumber || null,
            passportimg: passportimg || null,
            lat: lat || null,
            lng: lng || null,
        })
            .returning();
        // Exclude password from user object before sending response
        const { password: _password, ...userWithoutPassword } = newUser[0];
        return userWithoutPassword;
    }, "registerAdmin");
    return (0, responseHandler_1.sendCreated)(res, user, "User created successfully");
});
exports.loginAdmin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { number, password } = req.body;
    // Validate required fields
    if (!number || !password) {
        throw apiError_1.ApiError.badRequest("Number and password are required");
    }
    // Validate phone number format
    if (!/^[0-9]{10}$/.test(number)) {
        throw apiError_1.ApiError.badRequest("Invalid phone number format. Must be 10 digits");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        const existingUsers = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.number, number));
        if (existingUsers.length === 0) {
            throw apiError_1.ApiError.unauthorized("Invalid phone number");
        }
        const user = existingUsers[0];
        // Check if user has a password
        if (!user.password) {
            throw apiError_1.ApiError.unauthorized("Please provide a password");
        }
        // Verify password using bcrypt
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw apiError_1.ApiError.unauthorized("Invalid password");
        }
        // Generate JWT token
        if (!process.env.ACCESS_TOKEN_SECRET) {
            throw apiError_1.ApiError.internal("Server misconfiguration: missing ACCESS_TOKEN_SECRET");
        }
        const accessToken = jsonwebtoken_1.default.sign({
            _id: user.id,
            number: user.number,
            role: user.role,
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "1d",
        });
        // Exclude password from user object before sending response
        const { password: _password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            accessToken,
        };
    }, "loginAdmin");
    return (0, responseHandler_1.sendSuccess)(res, result, "Admin login successful");
});
// Migration function to hash existing plain text passwords
exports.migratePasswords = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // This should only be run by admins
    const currentUser = req.user;
    if (!currentUser || currentUser.role !== "admin") {
        throw apiError_1.ApiError.forbidden("Only admins can run password migration");
    }
    const result = await (0, dbErrorHandler_1.withDatabaseErrorHandling)(async () => {
        // Get all users with plain text passwords (not starting with $2b$)
        const usersWithPlainPasswords = await db_1.db
            .select()
            .from(usermodel_1.UserTable)
            .where((0, drizzle_orm_2.sql) `${usermodel_1.UserTable.password} NOT LIKE '$2b$%' AND ${usermodel_1.UserTable.password} IS NOT NULL`);
        let migratedCount = 0;
        const saltRounds = 12;
        for (const user of usersWithPlainPasswords) {
            if (user.password && !user.password.startsWith("$2b$")) {
                // Hash the plain text password
                const hashedPassword = await bcryptjs_1.default.hash(user.password, saltRounds);
                // Update the user with hashed password
                await db_1.db
                    .update(usermodel_1.UserTable)
                    .set({ password: hashedPassword })
                    .where((0, drizzle_orm_1.eq)(usermodel_1.UserTable.id, user.id));
                migratedCount++;
            }
        }
        return {
            totalUsers: usersWithPlainPasswords.length,
            migratedCount,
            message: `Successfully migrated ${migratedCount} passwords to hashed format`,
        };
    }, "migratePasswords");
    return (0, responseHandler_1.sendSuccess)(res, result, "Password migration completed");
});
//# sourceMappingURL=authcontroller.js.map