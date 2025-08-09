import express, { Router } from "express";
import { verifyJWT, requirePIC } from "../middleware/auth";
import { validateRequest, picDateFilterSchema } from "../utils/validation";
import { getPickupCars, getDropoffCars } from "./piccontroller";

const router: Router = Router();

// PIC-specific routes
router.get(
  "/pickup-cars",
  verifyJWT,
  requirePIC,
  validateRequest(picDateFilterSchema),
  getPickupCars
);

// Also support singular form for flexibility
router.get(
  "/pickup-car",
  verifyJWT,
  requirePIC,
  validateRequest(picDateFilterSchema),
  getPickupCars
);

router.get(
  "/dropoff-cars",
  verifyJWT,
  requirePIC,
  validateRequest(picDateFilterSchema),
  getDropoffCars
);

// Also support singular form for flexibility
router.get(
  "/dropoff-car",
  verifyJWT,
  requirePIC,
  validateRequest(picDateFilterSchema),
  getDropoffCars
);

export default router;
