import { Router } from "express";
import {
  createBooking,
  getBookings,
  getbookingbypickupParkingId,
  getbookingbydropoffParkingId,
  getbookingbyid,
  getbookingbystatus,
  getbookingbyuserid,
  getbookingbycarid,
  getBookingByDateRange,
  getBookingByDateRangeByCarId,
  updatebooking,
  deletebooking,
  confirmAdvancePayment,
  submitConfirmationRequest,
  picApproveConfirmation,
  confirmFinalPayment,
  getPICDashboard,
} from "./bookingcontroller";
import {
  verifyJWT,
  requireUser,
  requirePIC,
  requireAdmin,
  requireOwnerOrAdmin,
} from "../middleware/auth";

const router: Router = Router();

// Public routes (no authentication required)
router.get("/get", getBookings);
router.get("/b/:id", getbookingbyid);
router.get("/bs", getbookingbystatus);
router.get("/bu/:id", getbookingbyuserid);
router.get("/bc/:id", getbookingbycarid);
router.post("/bd", getBookingByDateRange);
router.post("/bcd/:id", getBookingByDateRangeByCarId);

// User-only routes (for booking management)
router.post("/add", verifyJWT, requireUser, createBooking);
router.post("/confirm-advance", verifyJWT, requireUser, confirmAdvancePayment);
router.post(
  "/submit-confirmation",
  verifyJWT,
  requireUser,
  submitConfirmationRequest
);
router.post("/confirm-final", verifyJWT, requireUser, confirmFinalPayment);

// PIC-only routes (for parking management)
router.post("/pic-approve", verifyJWT, requirePIC, picApproveConfirmation);
router.get("/pic-dashboard", verifyJWT, requirePIC, getPICDashboard);

// Admin-only routes
router.get("/ppi/:id", verifyJWT, requireAdmin, getbookingbypickupParkingId);
router.get("/dpi/:id", verifyJWT, requireAdmin, getbookingbydropoffParkingId);

// Owner or Admin routes (for updating/deleting bookings)
router.put("/b/:id", verifyJWT, requireOwnerOrAdmin, updatebooking);
router.delete("/b/:id", verifyJWT, requireOwnerOrAdmin, deletebooking);

export default router;
