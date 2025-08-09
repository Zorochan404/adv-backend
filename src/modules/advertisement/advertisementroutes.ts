import express, { Router } from "express";
import {
  createAdvertisement,
  getAllAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  getActiveAdvertisements,
  incrementViewCount,
  incrementClickCount,
  getAdvertisementStats,
} from "./advertisementcontroller";
import { verifyJWT, requireAdmin } from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  advertisementCreateSchema,
  advertisementUpdateSchema,
  advertisementFilterSchema,
  paginationQuerySchema,
} from "../utils/validation";

const router: Router = express.Router();

// Public routes
router.get(
  "/active",
  validateRequest(advertisementFilterSchema),
  getActiveAdvertisements
);

// Create advertisement (admin only)
router.post(
  "/create",
  verifyJWT,
  requireAdmin,
  validateRequest(advertisementCreateSchema),
  createAdvertisement
);

// Admin routes
router.get(
  "/admin/all",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...advertisementFilterSchema, ...paginationQuerySchema }),
  getAllAdvertisements
);

router.get("/admin/stats", verifyJWT, requireAdmin, getAdvertisementStats);

// Parameterized routes (must come after specific routes)
router.post("/:id/view", validateRequest(idParamSchema), incrementViewCount);

router.post("/:id/click", validateRequest(idParamSchema), incrementClickCount);

router.get(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest(idParamSchema),
  getAdvertisementById
);

router.put(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...idParamSchema, ...advertisementUpdateSchema }),
  updateAdvertisement
);

router.delete(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest(idParamSchema),
  deleteAdvertisement
);

export default router;
