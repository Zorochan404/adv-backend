"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = void 0;
const apiError_1 = require("./apiError");
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => {
            // Check if headers have already been sent
            if (res.headersSent) {
                return;
            }
            // If it's already an ApiError, pass it through
            if (err instanceof apiError_1.ApiError) {
                return next(err);
            }
            // If it's a known error type, convert it to ApiError
            if (err.name === "ValidationError") {
                return next(apiError_1.ApiError.validationError(err.message));
            }
            if (err.name === "CastError") {
                return next(apiError_1.ApiError.badRequest("Invalid ID format"));
            }
            if (err.code === 11000) {
                return next(apiError_1.ApiError.conflict("Duplicate field value"));
            }
            // For unknown errors, log them and return internal server error
            console.error("Unhandled error:", err);
            return next(apiError_1.ApiError.internal("Something went wrong"));
        });
    };
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=asyncHandler.js.map