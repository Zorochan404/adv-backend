import express, { Router } from "express";
import {
  getParking,
  getParkingByFilter,
  getNearByParking,
  getParkingById,
  createParking,
  updateParking,
  deleteParking,
  getParkingByIDadmin,
  submitParkingApproval,
  getParkingApprovalRequests,
  updateParkingApprovalStatus,
  getUserParkingApprovalRequests,
} from "./parkingcontroller";
import { verifyJWT, requireAdmin } from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  parkingCreateSchema,
  parkingUpdateSchema,
  parkingFilterSchema,
  parkingLocationSchema,
  paginationQuerySchema,
  parkingApprovalCreateSchema,
  parkingApprovalUpdateSchema,
  parkingApprovalFilterSchema,
} from "../utils/validation";

const router: Router = express.Router();

// Public routes (no authentication required)
router.get("/get", validateRequest(parkingFilterSchema), getParking);
router.get("/search", validateRequest(parkingFilterSchema), getParkingByFilter);
router.get("/getbyid/:id", validateRequest(idParamSchema), getParkingById);
router.get("/nearby", validateRequest(parkingLocationSchema), getNearByParking);
router.post(
  "/nearby",
  validateRequest(parkingLocationSchema),
  getNearByParking
);

// Admin-only routes (for parking management)
router.post(
  "/add",
  verifyJWT,
  requireAdmin,
  validateRequest(parkingCreateSchema),
  createParking
);
router.get(
  "/getbyidadmin/:id",
  verifyJWT,
  requireAdmin,
  validateRequest(idParamSchema),
  getParkingByIDadmin
);
router.put(
  "/update/:id",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...idParamSchema, ...parkingUpdateSchema }),
  updateParking
);
router.delete(
  "/delete/:id",
  verifyJWT,
  requireAdmin,
  validateRequest(idParamSchema),
  deleteParking
);

// New routes for parking approval flow

// User submits parking approval request
router.post(
  "/submit-approval",
  verifyJWT,
  validateRequest(parkingApprovalCreateSchema),
  submitParkingApproval
);

// User gets their parking approval requests
router.get("/my-approval-requests", verifyJWT, getUserParkingApprovalRequests);

// Admin gets all parking approval requests
router.get(
  "/approval-requests",
  verifyJWT,
  requireAdmin,
  validateRequest(parkingApprovalFilterSchema),
  getParkingApprovalRequests
);

// Admin approves/rejects parking request
router.put(
  "/approval-requests/:id",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...idParamSchema, ...parkingApprovalUpdateSchema }),
  updateParkingApprovalStatus
);

export default router;
