"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    constructor(statusCode, data, message = "Success", metadata) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
        this.metadata = metadata;
    }
    // Static methods for common response types
    static success(data, message = "Success", metadata) {
        return new ApiResponse(200, data, message, metadata);
    }
    static created(data, message = "Resource created successfully", metadata) {
        return new ApiResponse(201, data, message, metadata);
    }
    static noContent(message = "No content", metadata) {
        return new ApiResponse(204, null, message, metadata);
    }
    static accepted(data, message = "Request accepted", metadata) {
        return new ApiResponse(202, data, message, metadata);
    }
    // Method to add metadata
    addMetadata(metadata) {
        this.metadata = { ...this.metadata, ...metadata };
        return this;
    }
    // Method to set response duration
    setDuration(duration) {
        if (!this.metadata) {
            this.metadata = {
                timestamp: new Date(),
                path: "",
                method: "",
            };
        }
        this.metadata.duration = duration;
        return this;
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=apiResponse.js.map