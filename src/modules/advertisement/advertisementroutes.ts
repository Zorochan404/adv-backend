import express, { Router } from "express";
import {
  createAdvertisement,
  getAllAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  getActiveAdvertisements,
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
  "/",
  validateRequest(advertisementFilterSchema),
  getActiveAdvertisements
);

// Admin routes
router.get(
  "/all",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...advertisementFilterSchema, ...paginationQuerySchema }),
  getAllAdvertisements
);
router.get(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest(idParamSchema),
  getAdvertisementById
);
router.post(
  "/",
  verifyJWT,
  requireAdmin,
  validateRequest(advertisementCreateSchema),
  createAdvertisement
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
