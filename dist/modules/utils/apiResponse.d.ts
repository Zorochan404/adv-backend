interface ResponseMetadata {
    timestamp: Date;
    path: string;
    method: string;
    duration?: number;
}
declare class ApiResponse {
    statusCode: number;
    data: any;
    message: string;
    success: boolean;
    metadata?: ResponseMetadata;
    constructor(statusCode: number, data: any, message?: string, metadata?: ResponseMetadata);
    static success(data: any, message?: string, metadata?: ResponseMetadata): ApiResponse;
    static created(data: any, message?: string, metadata?: ResponseMetadata): ApiResponse;
    static noContent(message?: string, metadata?: ResponseMetadata): ApiResponse;
    static accepted(data: any, message?: string, metadata?: ResponseMetadata): ApiResponse;
    addMetadata(metadata: Partial<ResponseMetadata>): this;
    setDuration(duration: number): this;
}
export { ApiResponse, ResponseMetadata };
//# sourceMappingURL=apiResponse.d.ts.map