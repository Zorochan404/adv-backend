import { Request, Response, NextFunction } from "express";
export declare const verifyJWT: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVendor: (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePIC: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireUser: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireOwnerOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireVendorOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requirePICOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map