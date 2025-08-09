interface ErrorDetails {
    field?: string;
    message: string;
    value?: any;
}
declare class ApiError extends Error {
    statusCode: number;
    data: any;
    message: string;
    success: boolean;
    errors: ErrorDetails[];
    isOperational: boolean;
    timestamp: Date;
    constructor(statusCode: number, message?: string, errors?: ErrorDetails[], stack?: string, isOperational?: boolean);
    static badRequest(message?: string, errors?: ErrorDetails[]): ApiError;
    static unauthorized(message?: string, errors?: ErrorDetails[]): ApiError;
    static forbidden(message?: string, errors?: ErrorDetails[]): ApiError;
    static notFound(message?: string, errors?: ErrorDetails[]): ApiError;
    static conflict(message?: string, errors?: ErrorDetails[]): ApiError;
    static validationError(message?: string, errors?: ErrorDetails[]): ApiError;
    static internal(message?: string, errors?: ErrorDetails[]): ApiError;
    static serviceUnavailable(message?: string, errors?: ErrorDetails[]): ApiError;
    addError(field: string, message: string, value?: any): this;
    isOperationalError(): boolean;
}
export { ApiError, ErrorDetails };
//# sourceMappingURL=apiError.d.ts.map