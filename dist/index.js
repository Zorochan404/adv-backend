"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const compression_1 = __importDefault(require("compression"));
// Import routers
const authroutes_1 = __importDefault(require("./modules/auth/authroutes"));
const userroute_1 = __importDefault(require("./modules/user/userroute"));
const carroute_1 = __importDefault(require("./modules/car/carroute"));
const parkingroute_1 = __importDefault(require("./modules/parking/parkingroute"));
const reviewroutes_1 = __importDefault(require("./modules/review/reviewroutes"));
const bookingroute_1 = __importDefault(require("./modules/booking/bookingroute"));
const advertisementroutes_1 = __importDefault(require("./modules/advertisement/advertisementroutes"));
const carcatalogroutes_1 = __importDefault(require("./modules/car/carcatalogroutes"));
const topuproutes_1 = __importDefault(require("./modules/booking/topuproutes"));
const picroutes_1 = __importDefault(require("./modules/pic/picroutes"));
// Import error handling utilities
const errorHandler_1 = require("./modules/utils/errorHandler");
const responseHandler_1 = require("./modules/utils/responseHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
        "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
        statusCode: 429,
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", limiter);
// Compression middleware
app.use((0, compression_1.default)());
// Body parsing middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Response handler middleware
app.use(responseHandler_1.responseHandlerMiddleware);
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    // Add request ID to headers for tracking
    req.headers["x-request-id"] = requestId;
    // Log request
    console.log(`📥 [${requestId}] ${req.method} ${req.path} - ${new Date().toISOString()}`);
    console.log(`📥 [${requestId}] Headers:`, {
        "user-agent": req.get("User-Agent"),
        "content-type": req.get("Content-Type"),
        authorization: req.get("Authorization") ? "Bearer ***" : "none",
    });
    // Add error handling for response
    res.on("error", (error) => {
        console.error(`❌ [${requestId}] Response error:`, error);
    });
    // Log response
    res.on("finish", () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const statusEmoji = status >= 200 && status < 300
            ? "✅"
            : status >= 400 && status < 500
                ? "⚠️"
                : "❌";
        console.log(`${statusEmoji} [${requestId}] ${req.method} ${req.path} - ${status} (${duration}ms)`);
    });
    next();
});
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
    });
});
// API routes
app.use("/api/v1/auth", authroutes_1.default);
app.use("/api/v1/user", userroute_1.default);
app.use("/api/v1/cars", carroute_1.default);
app.use("/api/v1/parking", parkingroute_1.default);
app.use("/api/v1/review", reviewroutes_1.default);
app.use("/api/v1/booking", bookingroute_1.default);
app.use("/api/v1/advertisements", advertisementroutes_1.default);
app.use("/api/v1/car-catalog", carcatalogroutes_1.default);
app.use("/api/v1/topups", topuproutes_1.default);
app.use("/api/v1/pic", picroutes_1.default);
// 404 handler for undefined routes
app.use(errorHandler_1.notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 5500;
// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
// Graceful shutdown handlers
process.on("SIGTERM", (0, errorHandler_1.gracefulShutdown)(server));
process.on("SIGINT", (0, errorHandler_1.gracefulShutdown)(server));
// Unhandled rejection handler
process.on("unhandledRejection", errorHandler_1.handleUnhandledRejection);
// Uncaught exception handler
process.on("uncaughtException", errorHandler_1.handleUncaughtException);
// Export for testing
exports.default = app;
//# sourceMappingURL=index.js.map