"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.shouldRegenerateOTP = exports.getOTPExpirationForPickup = exports.getOTPExpirationTime = exports.isOTPExpired = exports.validateOTP = exports.generateOTP = void 0;
const apiError_1 = require("./apiError");
/**
 * Generate a random 4-digit OTP
 */
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};
exports.generateOTP = generateOTP;
/**
 * Validate OTP format (4 digits)
 */
const validateOTP = (otp) => {
    return /^\d{4}$/.test(otp);
};
exports.validateOTP = validateOTP;
/**
 * Check if OTP is expired
 */
const isOTPExpired = (expiresAt) => {
    return new Date() > expiresAt;
};
exports.isOTPExpired = isOTPExpired;
/**
 * Calculate OTP expiration time (15 minutes from now by default)
 */
const getOTPExpirationTime = (minutes = 15) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};
exports.getOTPExpirationTime = getOTPExpirationTime;
/**
 * Calculate OTP expiration based on pickup time
 * If pickup is within 2 hours, OTP expires 30 minutes before pickup
 * Otherwise, OTP expires in 15 minutes
 */
const getOTPExpirationForPickup = (pickupDate) => {
    const now = new Date();
    const timeToPickup = pickupDate.getTime() - now.getTime();
    const hoursToPickup = timeToPickup / (1000 * 60 * 60);
    if (hoursToPickup <= 2) {
        // If pickup is within 2 hours, OTP expires 30 minutes before pickup
        return new Date(pickupDate.getTime() - 30 * 60 * 1000);
    }
    else {
        // Otherwise, OTP expires in 15 minutes
        return (0, exports.getOTPExpirationTime)(15);
    }
};
exports.getOTPExpirationForPickup = getOTPExpirationForPickup;
/**
 * Check if OTP should be regenerated due to pickup time change
 */
const shouldRegenerateOTP = (currentOTPExpiresAt, pickupDate) => {
    if (!currentOTPExpiresAt)
        return true;
    const expectedExpiration = (0, exports.getOTPExpirationForPickup)(pickupDate);
    const timeDifference = Math.abs(expectedExpiration.getTime() - currentOTPExpiresAt.getTime());
    // Regenerate if expiration time differs by more than 5 minutes
    return timeDifference > 5 * 60 * 1000;
};
exports.shouldRegenerateOTP = shouldRegenerateOTP;
/**
 * Verify OTP with proper error handling
 */
const verifyOTP = (providedOTP, storedOTP, expiresAt, isVerified) => {
    // Check if OTP exists
    if (!storedOTP) {
        throw apiError_1.ApiError.badRequest("No OTP found for this booking");
    }
    // Check if OTP is already verified
    if (isVerified) {
        throw apiError_1.ApiError.badRequest("OTP has already been verified");
    }
    // Check if OTP is expired
    if (expiresAt && (0, exports.isOTPExpired)(expiresAt)) {
        throw apiError_1.ApiError.badRequest("OTP has expired. Please request a new one");
    }
    // Validate OTP format
    if (!(0, exports.validateOTP)(providedOTP)) {
        throw apiError_1.ApiError.badRequest("Invalid OTP format. Please enter a 4-digit code");
    }
    // Check if OTP matches
    if (providedOTP !== storedOTP) {
        throw apiError_1.ApiError.badRequest("Invalid OTP. Please check and try again");
    }
};
exports.verifyOTP = verifyOTP;
//# sourceMappingURL=otpUtils.js.map