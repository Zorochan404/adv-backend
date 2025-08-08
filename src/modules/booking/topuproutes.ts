import express, { Router } from "express";
import {
  createTopup,
  getActiveTopups,
  applyTopupToBooking,
  getBookingTopups,
  getAllTopups,
  updateTopup,
  deleteTopup,
} from "./topupcontroller";
import { verifyJWT, requireAdmin, requireUser } from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  topupCreateSchema,
  topupUpdateSchema,
  topupApplySchema,
  paginationQuerySchema,
} from "../utils/validation";

const router: Router = express.Router();

// Public routes
router.get("/active", getActiveTopups);

// User routes
router.post(
  "/apply",
  verifyJWT,
  requireUser,
  validateRequest(topupApplySchema),
  applyTopupToBooking
);
router.get(
  "/booking/:bookingId",
  verifyJWT,
  requireUser,
  validateRequest(idParamSchema),
  getBookingTopups
);

// Admin routes
router.get(
  "/",
  verifyJWT,
  requireAdmin,
  validateRequest(paginationQuerySchema),
  getAllTopups
);
router.post(
  "/",
  verifyJWT,
  requireAdmin,
  validateRequest(topupCreateSchema),
  createTopup
);
router.put(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...idParamSchema, ...topupUpdateSchema }),
  updateTopup
);
router.delete(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest(idParamSchema),
  deleteTopup
);

export default router;
