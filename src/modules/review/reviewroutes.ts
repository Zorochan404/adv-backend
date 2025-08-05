import { Router } from "express";
import {
  verifyJWT,
  requireUser,
  requireOwnerOrAdmin,
} from "../middleware/auth";
import {
  addreview,
  getreviews,
  getreviewsbycars,
  updatereview,
  deletereview,
} from "./reviewcontroller";

const reviewRouter: Router = Router();

// Public routes (no authentication required)
reviewRouter.get("/getreviews", getreviews);
reviewRouter.get("/getreviewsbycars/:carid", getreviewsbycars);

// User-only routes (for creating reviews)
reviewRouter.post("/addreview/:carid", verifyJWT, requireUser, addreview);

// Owner or Admin routes (for updating/deleting reviews)
reviewRouter.put(
  "/updatereview/:reviewid",
  verifyJWT,
  requireOwnerOrAdmin,
  updatereview
);
reviewRouter.delete(
  "/deletereview/:reviewid",
  verifyJWT,
  requireOwnerOrAdmin,
  deletereview
);

export default reviewRouter;
