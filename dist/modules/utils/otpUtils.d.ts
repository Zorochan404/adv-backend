/**
 * Generate a random 4-digit OTP
 */
export declare const generateOTP: () => string;
/**
 * Validate OTP format (4 digits)
 */
export declare const validateOTP: (otp: string) => boolean;
/**
 * Check if OTP is expired
 */
export declare const isOTPExpired: (expiresAt: Date) => boolean;
/**
 * Calculate OTP expiration time (15 minutes from now by default)
 */
export declare const getOTPExpirationTime: (minutes?: number) => Date;
/**
 * Calculate OTP expiration based on pickup time
 * If pickup is within 2 hours, OTP expires 30 minutes before pickup
 * Otherwise, OTP expires in 15 minutes
 */
export declare const getOTPExpirationForPickup: (pickupDate: Date) => Date;
/**
 * Check if OTP should be regenerated due to pickup time change
 */
export declare const shouldRegenerateOTP: (currentOTPExpiresAt: Date | null, pickupDate: Date) => boolean;
/**
 * Verify OTP with proper error handling
 */
export declare const verifyOTP: (providedOTP: string, storedOTP: string | null, expiresAt: Date | null, isVerified: boolean) => void;
//# sourceMappingURL=otpUtils.d.ts.map