import { Router } from "express";
import { loginAdmin, loginuser, registerAdmin } from "./authcontroller";

const router = Router();

router.post("/login", loginuser);
router.post("/registerAdmin", registerAdmin);
router.post("/loginAdmin", loginAdmin);
export default router;