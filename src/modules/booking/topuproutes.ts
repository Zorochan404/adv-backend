import { Router } from "express";
import {
  createTopup,
  getActiveTopups,
  applyTopupToBooking,
  getBookingTopups,
  getAllTopups,
  updateTopup,
  deleteTopup,
} from "./topupcontroller";
import { verifyJWT, requireUser, requireAdmin } from "../middleware/auth";

const topupRouter: Router = Router();

// Public routes (no authentication required)
topupRouter.get("/active", getActiveTopups);
topupRouter.get("/booking/:bookingId", getBookingTopups);

// User-only routes (for applying topups)
topupRouter.post("/apply", verifyJWT, requireUser, applyTopupToBooking);

// Admin-only routes (for topup management)
topupRouter.post("/create", verifyJWT, requireAdmin, createTopup);
topupRouter.get("/admin/all", verifyJWT, requireAdmin, getAllTopups);
topupRouter.put("/admin/:id", verifyJWT, requireAdmin, updateTopup);
topupRouter.delete("/admin/:id", verifyJWT, requireAdmin, deleteTopup);

export default topupRouter;
