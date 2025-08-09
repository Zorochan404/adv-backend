import { Request, Response } from "express";
export declare class ResponseHandler {
    private req;
    private res;
    private startTime;
    constructor(req: Request, res: Response);
    success(data: any, message?: string): Response<any, Record<string, any>>;
    created(data: any, message?: string): Response<any, Record<string, any>>;
    noContent(message?: string): Response<any, Record<string, any>>;
    accepted(data: any, message?: string): Response<any, Record<string, any>>;
    paginated(data: any[], total: number, page: number, limit: number, message?: string): Response<any, Record<string, any>>;
    list(data: any[], total: number, message?: string): Response<any, Record<string, any>>;
    item(data: any, message?: string): Response<any, Record<string, any>>;
    deleted(message?: string): Response<any, Record<string, any>>;
    updated(data: any, message?: string): Response<any, Record<string, any>>;
    custom(statusCode: number, data: any, message: string): Response<any, Record<string, any>>;
}
export declare const createResponseHandler: (req: Request, res: Response) => ResponseHandler;
export declare const responseHandlerMiddleware: (req: Request, res: Response, next: any) => void;
export declare const sendSuccess: (res: Response, data: any, message?: string, statusCode?: number) => Response<any, Record<string, any>>;
export declare const sendCreated: (res: Response, data: any, message?: string) => Response<any, Record<string, any>>;
export declare const sendUpdated: (res: Response, data: any, message?: string) => Response<any, Record<string, any>>;
export declare const sendDeleted: (res: Response, message?: string) => Response<any, Record<string, any>>;
export declare const sendItem: (res: Response, data: any, message?: string) => Response<any, Record<string, any>>;
export declare const sendList: (res: Response, data: any[], total: number, message?: string) => Response<any, Record<string, any>>;
export declare const sendPaginated: (res: Response, data: any[], total: number, page: number, limit: number, message?: string) => Response<any, Record<string, any>>;
//# sourceMappingURL=responseHandler.d.ts.map