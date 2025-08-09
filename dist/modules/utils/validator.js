"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonSchemas = exports.validationRules = exports.validateRequest = void 0;
const apiError_1 = require("./apiError");
// Validation function
const validateField = (value, rule) => {
    const { field, required, type, minLength, maxLength, min, max, pattern, enum: enumValues, custom, } = rule;
    // Check if required
    if (required && (value === undefined || value === null || value === "")) {
        return `${field} is required`;
    }
    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
        return null;
    }
    // Type validation
    if (type) {
        switch (type) {
            case "string":
                if (typeof value !== "string") {
                    return `${field} must be a string`;
                }
                break;
            case "number":
                if (typeof value !== "number" || isNaN(value)) {
                    return `${field} must be a number`;
                }
                break;
            case "boolean":
                if (typeof value !== "boolean") {
                    return `${field} must be a boolean`;
                }
                break;
            case "array":
                if (!Array.isArray(value)) {
                    return `${field} must be an array`;
                }
                break;
            case "object":
                if (typeof value !== "object" ||
                    Array.isArray(value) ||
                    value === null) {
                    return `${field} must be an object`;
                }
                break;
        }
    }
    // String-specific validations
    if (typeof value === "string") {
        if (minLength && value.length < minLength) {
            return `${field} must be at least ${minLength} characters long`;
        }
        if (maxLength && value.length > maxLength) {
            return `${field} must be at most ${maxLength} characters long`;
        }
        if (pattern && !pattern.test(value)) {
            return `${field} format is invalid`;
        }
    }
    // Number-specific validations
    if (typeof value === "number") {
        if (min !== undefined && value < min) {
            return `${field} must be at least ${min}`;
        }
        if (max !== undefined && value > max) {
            return `${field} must be at most ${max}`;
        }
    }
    // Array-specific validations
    if (Array.isArray(value)) {
        if (minLength && value.length < minLength) {
            return `${field} must have at least ${minLength} items`;
        }
        if (maxLength && value.length > maxLength) {
            return `${field} must have at most ${maxLength} items`;
        }
    }
    // Enum validation
    if (enumValues && !enumValues.includes(value)) {
        return `${field} must be one of: ${enumValues.join(", ")}`;
    }
    // Custom validation
    if (custom) {
        const result = custom(value);
        if (result !== true) {
            return typeof result === "string" ? result : `${field} is invalid`;
        }
    }
    return null;
};
// Main validation middleware
const validateRequest = (schema) => {
    return (req, res, next) => {
        const errors = [];
        // Validate body
        if (schema.body) {
            schema.body.forEach((rule) => {
                const error = validateField(req.body[rule.field], rule);
                if (error) {
                    errors.push({
                        field: rule.field,
                        message: error,
                        value: req.body[rule.field],
                    });
                }
            });
        }
        // Validate query parameters
        if (schema.query) {
            schema.query.forEach((rule) => {
                const error = validateField(req.query[rule.field], rule);
                if (error) {
                    errors.push({
                        field: rule.field,
                        message: error,
                        value: req.query[rule.field],
                    });
                }
            });
        }
        // Validate path parameters
        if (schema.params) {
            schema.params.forEach((rule) => {
                const error = validateField(req.params[rule.field], rule);
                if (error) {
                    errors.push({
                        field: rule.field,
                        message: error,
                        value: req.params[rule.field],
                    });
                }
            });
        }
        if (errors.length > 0) {
            throw apiError_1.ApiError.validationError("Validation failed", errors);
        }
        next();
    };
};
exports.validateRequest = validateRequest;
// Common validation rules
exports.validationRules = {
    // String validations
    requiredString: (field, maxLength) => ({
        field,
        required: true,
        type: "string",
        maxLength,
    }),
    optionalString: (field, maxLength) => ({
        field,
        type: "string",
        maxLength,
    }),
    email: (field) => ({
        field,
        required: true,
        type: "string",
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    }),
    phone: (field) => ({
        field,
        required: true,
        type: "string",
        pattern: /^[0-9]{10}$/,
    }),
    // Number validations
    requiredNumber: (field, min, max) => ({
        field,
        required: true,
        type: "number",
        min,
        max,
    }),
    optionalNumber: (field, min, max) => ({
        field,
        type: "number",
        min,
        max,
    }),
    // Boolean validations
    requiredBoolean: (field) => ({
        field,
        required: true,
        type: "boolean",
    }),
    // Array validations
    requiredArray: (field, minLength, maxLength) => ({
        field,
        required: true,
        type: "array",
        minLength,
        maxLength,
    }),
    // Object validations
    requiredObject: (field) => ({
        field,
        required: true,
        type: "object",
    }),
    // ID validation
    id: (field) => ({
        field,
        required: true,
        type: "string",
        pattern: /^[0-9]+$/,
    }),
    // Enum validation
    enum: (field, values) => ({
        field,
        required: true,
        enum: values,
    }),
    // Custom validation
    custom: (field, validator) => ({
        field,
        required: true,
        custom: validator,
    }),
};
// Common validation schemas
exports.commonSchemas = {
    // Pagination schema
    pagination: {
        query: [
            exports.validationRules.optionalNumber("page", 1),
            exports.validationRules.optionalNumber("limit", 1, 100),
        ],
    },
    // ID parameter schema
    idParam: {
        params: [exports.validationRules.id("id")],
    },
    // Search schema
    search: {
        query: [
            exports.validationRules.optionalString("q", 100),
            exports.validationRules.optionalNumber("page", 1),
            exports.validationRules.optionalNumber("limit", 1, 100),
        ],
    },
};
//# sourceMappingURL=validator.js.map