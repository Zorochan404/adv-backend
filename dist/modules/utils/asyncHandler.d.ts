import { NextFunction, Request, Response } from "express";
type AsyncFunction<T = Request> = (req: T, res: Response, next: NextFunction) => Promise<any>;
declare const asyncHandler: <T = Request>(requestHandler: AsyncFunction<T>) => (req: Request, res: Response, next: NextFunction) => void;
export { asyncHandler };
//# sourceMappingURL=asyncHandler.d.ts.map