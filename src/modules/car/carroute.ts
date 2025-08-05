import { Router } from "express";
import {
  createCar,
  getCar,
  getCarById,
  getCarByIdforadmin,
  updateCar,
  deletecar,
  getNearestPopularCars,
  getNearestAvailableCars,
  getCarByParkingId,
} from "./carcontroller";
import {
  verifyJWT,
  requireVendorOrAdmin,
  requireAdmin,
} from "../middleware/auth";

const carRouter: Router = Router();

// Public routes (no authentication required)
carRouter.get("/get", getCar);
carRouter.get("/getcar/:id", getCarById);
carRouter.get("/nearestpopularcars", getNearestPopularCars);
carRouter.get("/nearestavailablecars", getNearestAvailableCars);
carRouter.get("/carbyparking/:id", getCarByParkingId);

// Admin-only routes (for car management)
carRouter.get("/admin/:id", verifyJWT, requireAdmin, getCarByIdforadmin);

// Vendor or Admin routes (for car management)
carRouter.post("/add", verifyJWT, requireVendorOrAdmin, createCar);
carRouter.put("/update/:id", verifyJWT, requireVendorOrAdmin, updateCar);
carRouter.delete("/delete/:id", verifyJWT, requireVendorOrAdmin, deletecar);

export default carRouter;
