import express, { Router } from "express";
import {
  createBooking,
  getbookingbyid,
  getbookingbyuserid,
  updatebooking,
  deletebooking,
  confirmAdvancePayment,
  submitConfirmationRequest,
  picApproveConfirmation,
  confirmFinalPayment,
  getPICDashboard,
} from "./bookingcontroller";
import { verifyJWT, requireUser, requirePIC } from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  bookingCreateSchema,
  bookingPaymentSchema,
  bookingConfirmationSchema,
  bookingPICApprovalSchema,
  paginationQuerySchema,
} from "../utils/validation";

const router: Router = express.Router();

// User routes
router.post(
  "/",
  verifyJWT,
  requireUser,
  validateRequest(bookingCreateSchema),
  createBooking
);
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

// PIC routes
router.get("/pic/dashboard", verifyJWT, requirePIC, getPICDashboard);

export default router;
