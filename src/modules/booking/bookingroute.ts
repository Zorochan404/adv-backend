import express, { Router } from "express";
import {
  createBooking,
  getBookingByDateRange,
  getbookingbyid,
  getbookingbyuserid,
  updatebooking,
  deletebooking,
  confirmAdvancePayment,
  submitConfirmationRequest,
  picApproveConfirmation,
  confirmFinalPayment,
  getPICDashboard,
  verifyBookingOTP,
  resendBookingOTP,
  getBookingOTP,
  rescheduleBooking,
  getPICByEntity,
  getPICConfirmationRequests,
  resubmitConfirmationRequest,
  getUserRejectedConfirmations,
  getBookingStatus,
  getUserBookingsWithStatus,
  confirmCarPickup,
  checkBookingOverdue,
  applyTopupToBooking,
  calculateLateFees,
  payLateFees,
  confirmCarReturn,
  getEarningsOverview,
} from "./bookingcontroller";
import {
  verifyJWT,
  requireUser,
  requirePIC,
  requireAdmin,
} from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  bookingIdParamSchema,
  bookingCreateSchema,
  bookingPaymentSchema,
  bookingConfirmationSchema,
  bookingPICApprovalSchema,
  bookingOTPVerificationSchema,
  bookingResendOTPSchema,
  bookingRescheduleSchema,
  paginationQuerySchema,
  topupApplySchema,
  lateFeePaymentSchema,
  earningsOverviewSchema,
  picDateFilterSchema,
} from "../utils/validation";

const router: Router = express.Router();

// Create booking route
router.post(
  "/",
  verifyJWT,
  requireUser,
  validateRequest(bookingCreateSchema),
  createBooking
);

// User routes

router.get(
  "/user",
  verifyJWT,
  requireUser,
  validateRequest(paginationQuerySchema),
  getbookingbyuserid
);

router.get(
  "/:id",
  verifyJWT,
  requireUser,
  validateRequest(idParamSchema),
  getbookingbyid
);
router.put(
  "/:id",
  verifyJWT,
  requireUser,
  validateRequest({ ...idParamSchema, ...bookingCreateSchema }),
  updatebooking
);
router.delete(
  "/:id",
  verifyJWT,
  requireUser,
  validateRequest(idParamSchema),
  deletebooking
);

// Payment routes
router.post(
  "/advance-payment",
  verifyJWT,
  requireUser,
  validateRequest(bookingPaymentSchema),
  confirmAdvancePayment
);
router.post(
  "/submit-confirmation",
  verifyJWT,
  requireUser,
  validateRequest(bookingConfirmationSchema),
  submitConfirmationRequest
);

// Resubmit confirmation request after rejection
router.post(
  "/resubmit-confirmation",
  verifyJWT,
  requireUser,
  validateRequest(bookingConfirmationSchema),
  resubmitConfirmationRequest
);

// Get user's rejected confirmation requests
router.get(
  "/user/rejected-confirmations",
  verifyJWT,
  requireUser,
  getUserRejectedConfirmations
);

// Get comprehensive booking status
router.get("/status/:bookingId", verifyJWT, requireUser, getBookingStatus);

// Get all user bookings with status summaries
router.get(
  "/user/with-status",
  verifyJWT,
  requireUser,
  getUserBookingsWithStatus
);

// Confirm car pickup (PIC confirms car has been taken from parking lot)
router.post("/confirm-pickup", verifyJWT, requirePIC, confirmCarPickup);

// PIC (Parking In Charge) routes
router.get(
  "/pic/dashboard",
  verifyJWT,
  requirePIC,
  validateRequest(picDateFilterSchema),
  getPICDashboard
);

// Get all confirmation requests for PIC's parking lot
router.get(
  "/pic/confirmation-requests",
  verifyJWT,
  requirePIC,
  getPICConfirmationRequests
);

// Get PIC by entity (car, booking, or parking) - Must come after /pic/* routes
router.get("/pic-by-entity", verifyJWT, getPICByEntity);

// Extension and topup routes
router.get("/:bookingId/overdue", verifyJWT, requireUser, checkBookingOverdue);
router.post(
  "/apply-topup",
  verifyJWT,
  requireUser,
  validateRequest(topupApplySchema),
  applyTopupToBooking
);
router.get("/:bookingId/late-fees", verifyJWT, requireUser, calculateLateFees);
router.post(
  "/pay-late-fees",
  verifyJWT,
  requireUser,
  validateRequest(lateFeePaymentSchema),
  payLateFees
);

// Confirm car return (PIC confirms car has been returned to parking lot)
router.post("/confirm-return", verifyJWT, requirePIC, confirmCarReturn);

// Admin routes
router.get(
  "/earnings/overview",
  verifyJWT,
  requireAdmin,
  validateRequest(earningsOverviewSchema),
  getEarningsOverview
);

router.post(
  "/pic-approve",
  verifyJWT,
  requirePIC,
  validateRequest(bookingPICApprovalSchema),
  picApproveConfirmation
);
router.post(
  "/final-payment",
  verifyJWT,
  requireUser,
  validateRequest(bookingPaymentSchema),
  confirmFinalPayment
);

// OTP Verification Routes
router.post(
  "/verify-otp",
  verifyJWT,
  requirePIC,
  validateRequest(bookingOTPVerificationSchema),
  verifyBookingOTP
);

router.post(
  "/resend-otp",
  verifyJWT,
  requireUser,
  validateRequest(bookingResendOTPSchema),
  resendBookingOTP
);

router.get(
  "/otp/:bookingId",
  verifyJWT,
  requireUser,
  validateRequest(bookingIdParamSchema),
  getBookingOTP
);

// Reschedule booking
router.put(
  "/reschedule/:bookingId",
  verifyJWT,
  requireUser,
  validateRequest({ ...bookingIdParamSchema, ...bookingRescheduleSchema }),
  rescheduleBooking
);

export default router;
