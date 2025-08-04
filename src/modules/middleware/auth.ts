import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import { UserTable } from "../user/usermodel";
import { Request, Response, NextFunction } from "express";
import { db } from "../../drizzle/db";
import { eq } from "drizzle-orm";

export const verifyJWT = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.headers["authorization"]?.replace("Bearer ", "");

      // console.log(token);
      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      if (!process.env.ACCESS_TOKEN_SECRET) {
        throw new ApiError(
          500,
          "Server misconfiguration: missing ACCESS_TOKEN_SECRET"
        );
      }

      let decodedToken: any;
      try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      } catch (err) {
        throw new ApiError(401, "Invalid or expired access token");
      }

      if (
        !decodedToken ||
        typeof decodedToken !== "object" ||
        !("_id" in decodedToken)
      ) {
        throw new ApiError(401, "Invalid access token payload");
      }

      const user = await db
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, (decodedToken as any)._id))
        // exclude password and refreshToken
        .limit(1)
        .then((rows) => rows[0]);

      if (!user) {
        throw new ApiError(401, "Invalid Access Token");
      }

      // Attach user to request in a type-safe way
      (req as any).user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Invalid access token");
    }
  }
);
