import express, { Router } from "express";
import {
  getDashboardData,
  getDashboardMetrics,
  getCarAvailability,
  getParkingUtilization,
  getRevenueTrends,
  getRecentBookings,
  getBookingTimelineOverview,
} from "./admincontroller";
import { verifyJWT } from "../middleware/auth";
import { requireAdmin, requirePermission, Permission } from "../middleware/rbac";
import { validateRequest } from "../utils/validation";
import { z } from "zod";

const router: Router = express.Router();

// Validation schemas
const periodQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month']).optional().default('week')
});

const limitQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).optional().default(5)
});

// ========================================
// ADMIN DASHBOARD ROUTES
// ========================================

// Main comprehensive dashboard endpoint
router.get(
  "/dashboard",
  verifyJWT,
  requireAdmin,
  validateRequest(periodQuerySchema),
  getDashboardData
);

// Granular dashboard endpoints for specific widgets

// Key metrics (revenue, bookings, users, car availability)
router.get(
  "/dashboard/metrics",
  verifyJWT,
  requireAdmin,
  validateRequest(periodQuerySchema),
  getDashboardMetrics
);

// Car availability status
router.get(
  "/dashboard/car-availability",
  verifyJWT,
  requireAdmin,
  getCarAvailability
);

// Parking spot utilization
router.get(
  "/dashboard/parking-utilization",
  verifyJWT,
  requireAdmin,
  getParkingUtilization
);

// Revenue trends and charts data
router.get(
  "/dashboard/revenue-trends",
  verifyJWT,
  requireAdmin,
  validateRequest(periodQuerySchema),
  getRevenueTrends
);

// Recent bookings activity
router.get(
  "/dashboard/recent-bookings",
  verifyJWT,
  requireAdmin,
  validateRequest(limitQuerySchema),
  getRecentBookings
);

// Booking timeline overview with status tracking
router.get(
  "/dashboard/booking-timeline",
  verifyJWT,
  requireAdmin,
  getBookingTimelineOverview
);

// ========================================
// ALTERNATIVE RBAC-BASED ROUTES
// ========================================
// These routes use specific permissions instead of just admin role
// Uncomment if you want more granular permission control

/*
// Dashboard with analytics permission
router.get(
  "/dashboard",
  verifyJWT,
  requirePermission(Permission.VIEW_ANALYTICS),
  validateRequest(periodQuerySchema, 'query'),
  getDashboardData
);

// Metrics with analytics permission
router.get(
  "/dashboard/metrics",
  verifyJWT,
  requirePermission(Permission.VIEW_ANALYTICS),
  validateRequest(periodQuerySchema, 'query'),
  getDashboardMetrics
);

// Car availability with car management permission
router.get(
  "/dashboard/car-availability",
  verifyJWT,
  requirePermission(Permission.READ_CAR),
  getCarAvailability
);

// Parking utilization with parking management permission
router.get(
  "/dashboard/parking-utilization",
  verifyJWT,
  requirePermission(Permission.READ_PARKING),
  getParkingUtilization
);

// Revenue trends with analytics permission
router.get(
  "/dashboard/revenue-trends",
  verifyJWT,
  requirePermission(Permission.VIEW_ANALYTICS),
  validateRequest(periodQuerySchema, 'query'),
  getRevenueTrends
);

// Recent bookings with booking management permission
router.get(
  "/dashboard/recent-bookings",
  verifyJWT,
  requirePermission(Permission.READ_BOOKING),
  validateRequest(limitQuerySchema, 'query'),
  getRecentBookings
);
*/

export default router;
