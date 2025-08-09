import { ApiError } from "./apiError";
/**
 * Handle database errors and convert them to appropriate ApiError instances
 */
export declare const handleDatabaseError: (error: any, context?: string) => ApiError;
/**
 * Wrapper function to handle database operations with automatic error handling
 */
export declare const withDatabaseErrorHandling: <T>(operation: () => Promise<T>, context?: string) => Promise<T>;
/**
 * Decorator for database operations (alternative approach)
 */
export declare const dbErrorHandler: (context?: string) => (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
//# sourceMappingURL=dbErrorHandler.d.ts.map