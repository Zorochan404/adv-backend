import express from "express";
import {
  createCoupon,
  getAllCoupons,
  getActiveCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} from "./couponcontroller";
import { seedCoupons, clearCoupons } from "./seedCoupons";
import { verifyJWT, requireRole } from "../middleware/auth";

const router = express.Router();

// Admin routes (protected)
router.post("/", verifyJWT, requireRole(["admin"]), createCoupon);
router.get("/admin", verifyJWT, requireRole(["admin"]), getAllCoupons);
router.put("/:id", verifyJWT, requireRole(["admin"]), updateCoupon);
router.delete("/:id", verifyJWT, requireRole(["admin"]), deleteCoupon);
router.post("/seed", verifyJWT, requireRole(["admin"]), seedCoupons);
router.delete("/clear", verifyJWT, requireRole(["admin"]), clearCoupons);

// Public routes
router.get("/active", getActiveCoupons);
router.get("/:id", getCouponById);
router.post("/validate", validateCoupon);

export default router as express.Router;
