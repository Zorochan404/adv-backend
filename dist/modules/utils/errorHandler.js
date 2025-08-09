"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUncaughtException = exports.handleUnhandledRejection = exports.gracefulShutdown = exports.notFoundHandler = exports.errorHandler = void 0;
const apiError_1 = require("./apiError");
// Custom error logger
const logError = (error, req) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        statusCode: error.statusCode,
        message: error.message,
        stack: error.stack,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
        userId: req.user?.id || "anonymous",
    };
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
        console.error("🚨 Error Log:", JSON.stringify(errorLog, null, 2));
    }
    // In production, you might want to log to a file or external service
    // logger.error(errorLog);
};
// Validation error formatter
const formatValidationErrors = (error) => {
    if (error.errors && Array.isArray(error.errors)) {
        return error.errors.map((err) => ({
            field: err.path || err.field,
            message: err.message,
            value: err.value,
        }));
    }
    return [];
};
// Database error handler
const handleDatabaseError = (error) => {
    // PostgreSQL specific errors
    if (error.code === "23505") {
        // unique_violation
        return apiError_1.ApiError.conflict("Duplicate entry found");
    }
    if (error.code === "23503") {
        // foreign_key_violation
        return apiError_1.ApiError.badRequest("Referenced resource does not exist");
    }
    if (error.code === "23502") {
        // not_null_violation
        return apiError_1.ApiError.validationError("Required field is missing");
    }
    if (error.code === "22P02") {
        // invalid_text_representation
        return apiError_1.ApiError.badRequest("Invalid data format");
    }
    return apiError_1.ApiError.internal("Database operation failed");
};
// JWT error handler
const handleJWTError = (error) => {
    if (error.name === "JsonWebTokenError") {
        return apiError_1.ApiError.unauthorized("Invalid token");
    }
    if (error.name === "TokenExpiredError") {
        return apiError_1.ApiError.unauthorized("Token expired");
    }
    if (error.name === "NotBeforeError") {
        return apiError_1.ApiError.unauthorized("Token not active");
    }
    return apiError_1.ApiError.unauthorized("Token verification failed");
};
// Rate limiting error handler
const handleRateLimitError = (error) => {
    return apiError_1.ApiError.badRequest("Too many requests, please try again later");
};
// Main error handler middleware
const errorHandler = (error, req, res, next) => {
    let apiError;
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors = [];
    // Handle different types of errors
    if (error instanceof apiError_1.ApiError) {
        apiError = error;
        statusCode = error.statusCode;
        message = error.message;
        errors = error.errors;
    }
    else if (error.name === "ValidationError") {
        apiError = apiError_1.ApiError.validationError("Validation failed", formatValidationErrors(error));
        statusCode = 422;
        message = "Validation failed";
        errors = apiError.errors;
    }
    else if (error.name === "CastError") {
        apiError = apiError_1.ApiError.badRequest("Invalid ID format");
        statusCode = 400;
        message = "Invalid ID format";
    }
    else if (error.code && error.code.startsWith("23")) {
        apiError = handleDatabaseError(error);
        statusCode = apiError.statusCode;
        message = apiError.message;
        errors = apiError.errors;
    }
    else if (error.name && error.name.includes("JsonWebToken")) {
        apiError = handleJWTError(error);
        statusCode = apiError.statusCode;
        message = apiError.message;
        errors = apiError.errors;
    }
    else if (error.type === "entity.too.large") {
        apiError = apiError_1.ApiError.badRequest("Request entity too large");
        statusCode = 413;
        message = "Request entity too large";
    }
    else if (error.type === "entity.parse.failed") {
        apiError = apiError_1.ApiError.badRequest("Invalid JSON format");
        statusCode = 400;
        message = "Invalid JSON format";
    }
    else if (error.code === "LIMIT_FILE_SIZE") {
        apiError = apiError_1.ApiError.badRequest("File too large");
        statusCode = 413;
        message = "File too large";
    }
    else if (error.code === "LIMIT_UNEXPECTED_FILE") {
        apiError = apiError_1.ApiError.badRequest("Unexpected file field");
        statusCode = 400;
        message = "Unexpected file field";
    }
    else {
        // Unknown error
        apiError = apiError_1.ApiError.internal("Something went wrong");
        statusCode = 500;
        message = "Something went wrong";
    }
    // Log the error
    logError(apiError, req);
    // Prepare error response
    const errorResponse = {
        success: false,
        message,
        statusCode,
        timestamp: new Date(),
        path: req.path,
        method: req.method,
    };
    // Add errors array if there are validation errors
    if (errors.length > 0) {
        errorResponse.errors = errors;
    }
    // Add stack trace in development
    if (process.env.NODE_ENV === "development") {
        errorResponse.stack = error.stack;
    }
    // Send error response
    if (!res.headersSent) {
        res.status(statusCode).json(errorResponse);
    }
};
exports.errorHandler = errorHandler;
// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    const error = apiError_1.ApiError.notFound(`Route ${req.originalUrl} not found`);
    next(error);
};
exports.notFoundHandler = notFoundHandler;
// Graceful shutdown handler
const gracefulShutdown = (server) => {
    return (signal) => {
        console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
        server.close(() => {
            console.log("✅ Server closed successfully");
            process.exit(0);
        });
        // Force close after 10 seconds
        setTimeout(() => {
            console.error("❌ Could not close connections in time, forcefully shutting down");
            process.exit(1);
        }, 10000);
    };
};
exports.gracefulShutdown = gracefulShutdown;
// Unhandled rejection handler
const handleUnhandledRejection = (reason, promise) => {
    console.error("🚨 Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
};
exports.handleUnhandledRejection = handleUnhandledRejection;
// Uncaught exception handler
const handleUncaughtException = (error) => {
    console.error("🚨 Uncaught Exception:", error);
    process.exit(1);
};
exports.handleUncaughtException = handleUncaughtException;
//# sourceMappingURL=errorHandler.js.map