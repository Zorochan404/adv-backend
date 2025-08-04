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
import { verifyJWT } from "../middleware/auth";

const advertisementRouter: Router = Router();

// Public routes (no authentication required)
advertisementRouter.get("/active", getActiveAdvertisements);
advertisementRouter.get("/:id", getAdvertisementById);
advertisementRouter.post("/:id/view", incrementViewCount);
advertisementRouter.post("/:id/click", incrementClickCount);

// Protected routes (require authentication)
advertisementRouter.post("/create", verifyJWT, createAdvertisement);
advertisementRouter.get("/admin/all", verifyJWT, getAllAdvertisements);
advertisementRouter.put("/:id", verifyJWT, updateAdvertisement);
advertisementRouter.delete("/:id", verifyJWT, deleteAdvertisement);
advertisementRouter.get("/admin/stats", verifyJWT, getAdvertisementStats);

export default advertisementRouter;
