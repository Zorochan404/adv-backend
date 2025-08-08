import express, { Router } from "express";
import { loginuser, registerAdmin, loginAdmin } from "./authcontroller";
import { verifyJWT } from "../middleware/auth";
import {
  validateRequest,
  loginSchema,
  adminRegisterSchema,
  adminLoginSchema,
} from "../utils/validation";

const router: Router = express.Router();

// Public routes
router.post("/login", validateRequest(loginSchema), loginuser);
router.post(
  "/registerAdmin",
  verifyJWT,
  validateRequest(adminRegisterSchema),
  registerAdmin
);
router.post("/loginAdmin", validateRequest(adminLoginSchema), loginAdmin);

export default router;
