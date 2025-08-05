import { Router } from "express";
import {
  createParking,
  getParking,
  getParkingById,
  getParkingByIDadmin,
  updateParking,
  deleteParking,
} from "./parkingcontroller";
import { verifyJWT, requireAdmin } from "../middleware/auth";

const parkingRouter: Router = Router();

// Public routes (no authentication required)
parkingRouter.get("/get", getParking);
parkingRouter.get("/getbyid/:id", getParkingById);

// Admin-only routes (for parking management)
parkingRouter.post("/add", verifyJWT, requireAdmin, createParking);
parkingRouter.get(
  "/getbyidadmin/:id",
  verifyJWT,
  requireAdmin,
  getParkingByIDadmin
);
parkingRouter.put("/update/:id", verifyJWT, requireAdmin, updateParking);
parkingRouter.delete("/delete/:id", verifyJWT, requireAdmin, deleteParking);

export default parkingRouter;
