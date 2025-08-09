import { Request, Response, NextFunction } from "express";
export declare const errorHandler: (error: any, req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const gracefulShutdown: (server: any) => (signal: string) => void;
export declare const handleUnhandledRejection: (reason: any, promise: Promise<any>) => never;
export declare const handleUncaughtException: (error: Error) => never;
//# sourceMappingURL=errorHandler.d.ts.map