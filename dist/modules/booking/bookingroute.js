"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bookingcontroller_1 = require("./bookingcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Create booking route
router.post("/", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.bookingCreateSchema), bookingcontroller_1.createBooking);
// User routes
router.get("/user", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.paginationQuerySchema), bookingcontroller_1.getbookingbyuserid);
router.get("/:id", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.idParamSchema), bookingcontroller_1.getbookingbyid);
router.put("/:id", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)({ ...validation_1.idParamSchema, ...validation_1.bookingCreateSchema }), bookingcontroller_1.updatebooking);
router.delete("/:id", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.idParamSchema), bookingcontroller_1.deletebooking);
// Payment routes
router.post("/advance-payment", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.bookingPaymentSchema), bookingcontroller_1.confirmAdvancePayment);
router.post("/submit-confirmation", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.bookingConfirmationSchema), bookingcontroller_1.submitConfirmationRequest);
// Resubmit confirmation request after rejection
router.post("/resubmit-confirmation", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.bookingConfirmationSchema), bookingcontroller_1.resubmitConfirmationRequest);
// Get user's rejected confirmation requests
router.get("/user/rejected-confirmations", auth_1.verifyJWT, auth_1.requireUser, bookingcontroller_1.getUserRejectedConfirmations);
// Get comprehensive booking status
router.get("/status/:bookingId", auth_1.verifyJWT, auth_1.requireUser, bookingcontroller_1.getBookingStatus);
// Get all user bookings with status summaries
router.get("/user/with-status", auth_1.verifyJWT, auth_1.requireUser, bookingcontroller_1.getUserBookingsWithStatus);
// Confirm car pickup (PIC confirms car has been taken from parking lot)
router.post("/confirm-pickup", auth_1.verifyJWT, auth_1.requirePIC, bookingcontroller_1.confirmCarPickup);
// PIC (Parking In Charge) routes
router.get("/pic/dashboard", auth_1.verifyJWT, auth_1.requirePIC, (0, validation_1.validateRequest)(validation_1.picDateFilterSchema), bookingcontroller_1.getPICDashboard);
// Get all confirmation requests for PIC's parking lot
router.get("/pic/confirmation-requests", auth_1.verifyJWT, auth_1.requirePIC, bookingcontroller_1.getPICConfirmationRequests);
// Get PIC by entity (car, booking, or parking) - Must come after /pic/* routes
router.get("/pic-by-entity", auth_1.verifyJWT, bookingcontroller_1.getPICByEntity);
// Extension and topup routes
router.get("/:bookingId/overdue", auth_1.verifyJWT, auth_1.requireUser, bookingcontroller_1.checkBookingOverdue);
router.post("/apply-topup", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.topupApplySchema), bookingcontroller_1.applyTopupToBooking);
router.get("/:bookingId/late-fees", auth_1.verifyJWT, auth_1.requireUser, bookingcontroller_1.calculateLateFees);
router.post("/pay-late-fees", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.lateFeePaymentSchema), bookingcontroller_1.payLateFees);
// Confirm car return (PIC confirms car has been returned to parking lot)
router.post("/confirm-return", auth_1.verifyJWT, auth_1.requirePIC, bookingcontroller_1.confirmCarReturn);
// Admin routes
router.get("/earnings/overview", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.earningsOverviewSchema), bookingcontroller_1.getEarningsOverview);
router.post("/pic-approve", auth_1.verifyJWT, auth_1.requirePIC, (0, validation_1.validateRequest)(validation_1.bookingPICApprovalSchema), bookingcontroller_1.picApproveConfirmation);
router.post("/final-payment", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.bookingPaymentSchema), bookingcontroller_1.confirmFinalPayment);
// OTP Verification Routes
router.post("/verify-otp", auth_1.verifyJWT, auth_1.requirePIC, (0, validation_1.validateRequest)(validation_1.bookingOTPVerificationSchema), bookingcontroller_1.verifyBookingOTP);
router.post("/resend-otp", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.bookingResendOTPSchema), bookingcontroller_1.resendBookingOTP);
router.get("/otp/:bookingId", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.bookingIdParamSchema), bookingcontroller_1.getBookingOTP);
// Reschedule booking
router.put("/reschedule/:bookingId", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)({ ...validation_1.bookingIdParamSchema, ...validation_1.bookingRescheduleSchema }), bookingcontroller_1.rescheduleBooking);
exports.default = router;
//# sourceMappingURL=bookingroute.js.map