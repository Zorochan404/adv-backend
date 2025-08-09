"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "", isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;
        this.isOperational = isOperational;
        this.timestamp = new Date();
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    // Static methods for common error types
    static badRequest(message = "Bad Request", errors = []) {
        return new ApiError(400, message, errors);
    }
    static unauthorized(message = "Unauthorized", errors = []) {
        return new ApiError(401, message, errors);
    }
    static forbidden(message = "Forbidden", errors = []) {
        return new ApiError(403, message, errors);
    }
    static notFound(message = "Resource not found", errors = []) {
        return new ApiError(404, message, errors);
    }
    static conflict(message = "Resource conflict", errors = []) {
        return new ApiError(409, message, errors);
    }
    static validationError(message = "Validation failed", errors = []) {
        return new ApiError(422, message, errors);
    }
    static internal(message = "Internal Server Error", errors = []) {
        return new ApiError(500, message, errors, "", false);
    }
    static serviceUnavailable(message = "Service Unavailable", errors = []) {
        return new ApiError(503, message, errors, "", false);
    }
    // Method to add field-specific errors
    addError(field, message, value) {
        this.errors.push({ field, message, value });
        return this;
    }
    // Method to check if error is operational
    isOperationalError() {
        return this.isOperational;
    }
}
exports.ApiError = ApiError;
//# sourceMappingURL=apiError.js.map