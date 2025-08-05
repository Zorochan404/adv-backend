import { Router } from "express";
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

const advertisementRouter: Router = Router();

// Public routes (no authentication required)
advertisementRouter.get("/active", getActiveAdvertisements);
advertisementRouter.get("/:id", getAdvertisementById);
advertisementRouter.post("/view/:id", incrementViewCount);
advertisementRouter.post("/click/:id", incrementClickCount);

// Admin-only routes
advertisementRouter.post(
  "/create",
  verifyJWT,
  requireAdmin,
  createAdvertisement
);
advertisementRouter.get(
  "/admin/all",
  verifyJWT,
  requireAdmin,
  getAllAdvertisements
);
advertisementRouter.put("/:id", verifyJWT, requireAdmin, updateAdvertisement);
advertisementRouter.delete(
  "/:id",
  verifyJWT,
  requireAdmin,
  deleteAdvertisement
);
advertisementRouter.get(
  "/admin/stats",
  verifyJWT,
  requireAdmin,
  getAdvertisementStats
);

export default advertisementRouter;
