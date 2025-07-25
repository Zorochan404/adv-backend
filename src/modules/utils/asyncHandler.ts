import { NextFunction, Request, Response } from "express";

const asyncHandler = (requestHandler: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err: any) => next(err))
    }
}


export { asyncHandler }
