"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginated = exports.sendList = exports.sendItem = exports.sendDeleted = exports.sendUpdated = exports.sendCreated = exports.sendSuccess = exports.responseHandlerMiddleware = exports.createResponseHandler = exports.ResponseHandler = void 0;
const apiResponse_1 = require("./apiResponse");
// Response handler class
class ResponseHandler {
    constructor(req, res) {
        this.req = req;
        this.res = res;
        this.startTime = Date.now();
    }
    // Success responses
    success(data, message = "Success") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.success(data, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    created(data, message = "Resource created successfully") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.created(data, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    noContent(message = "No content") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.noContent(message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    accepted(data, message = "Request accepted") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.accepted(data, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    // Paginated response
    paginated(data, total, page, limit, message = "Data retrieved successfully") {
        const duration = Date.now() - this.startTime;
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;
        const pagination = {
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: limit,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null,
        };
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.success({
            data,
            pagination,
        }, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    // List response with count
    list(data, total, message = "Data retrieved successfully") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.success({
            data,
            total,
        }, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    // Single item response
    item(data, message = "Item retrieved successfully") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.success(data, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    // Delete response
    deleted(message = "Resource deleted successfully") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.success(null, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    // Update response
    updated(data, message = "Resource updated successfully") {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = apiResponse_1.ApiResponse.success(data, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
    // Custom response
    custom(statusCode, data, message) {
        const duration = Date.now() - this.startTime;
        const metadata = {
            timestamp: new Date(),
            path: this.req.path,
            method: this.req.method,
            duration,
        };
        const response = new apiResponse_1.ApiResponse(statusCode, data, message, metadata);
        return this.res.status(response.statusCode).json(response);
    }
}
exports.ResponseHandler = ResponseHandler;
// Factory function to create response handler
const createResponseHandler = (req, res) => {
    return new ResponseHandler(req, res);
};
exports.createResponseHandler = createResponseHandler;
// Express middleware to attach response handler
const responseHandlerMiddleware = (req, res, next) => {
    req.response = (0, exports.createResponseHandler)(req, res);
    next();
};
exports.responseHandlerMiddleware = responseHandlerMiddleware;
// Simple response helper functions for common use cases
const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        statusCode,
    });
};
exports.sendSuccess = sendSuccess;
const sendCreated = (res, data, message = "Resource created successfully") => {
    return (0, exports.sendSuccess)(res, data, message, 201);
};
exports.sendCreated = sendCreated;
const sendUpdated = (res, data, message = "Resource updated successfully") => {
    return (0, exports.sendSuccess)(res, data, message, 200);
};
exports.sendUpdated = sendUpdated;
const sendDeleted = (res, message = "Resource deleted successfully") => {
    return (0, exports.sendSuccess)(res, null, message, 200);
};
exports.sendDeleted = sendDeleted;
const sendItem = (res, data, message = "Item retrieved successfully") => {
    return (0, exports.sendSuccess)(res, data, message, 200);
};
exports.sendItem = sendItem;
const sendList = (res, data, total, message = "Data retrieved successfully") => {
    return (0, exports.sendSuccess)(res, { data, total }, message, 200);
};
exports.sendList = sendList;
const sendPaginated = (res, data, total, page, limit, message = "Data retrieved successfully") => {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    const pagination = {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNext,
        hasPrev,
        nextPage: hasNext ? page + 1 : null,
        prevPage: hasPrev ? page - 1 : null,
    };
    return (0, exports.sendSuccess)(res, { data, pagination }, message, 200);
};
exports.sendPaginated = sendPaginated;
//# sourceMappingURL=responseHandler.js.map