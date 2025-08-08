import express, { Router } from "express";
import {
  testCarConnection,
  getCar,
  getNearestCars,
  getNearestAvailableCars,
  getNearestPopularCars,
  getCarById,
  getCarByParkingId,
  searchbynameornumber,
  filterCars,
  createCar,
  updateCar,
  deleteCar,
} from "./carcontroller";
import {
  verifyJWT,
  requireAdmin,
  requireVendor,
  requireVendorOrAdmin,
} from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  carCreateSchema,
  carUpdateSchema,
  carSearchSchema,
  carFilterSchema,
  carLocationSchema,
  paginationQuerySchema,
} from "../utils/validation";

const router: Router = express.Router();

// Public routes (specific routes first)
router.get("/test", testCarConnection);
router.get("/nearestcars", validateRequest(carLocationSchema), getNearestCars);
router.post("/nearestcars", validateRequest(carLocationSchema), getNearestCars);
router.get(
  "/nearestavailablecars",
  validateRequest(carLocationSchema),
  getNearestAvailableCars
);
router.post(
  "/nearestavailablecars",
  validateRequest(carLocationSchema),
  getNearestAvailableCars
);
router.get(
  "/nearestpopularcars",
  validateRequest(carLocationSchema),
  getNearestPopularCars
);
router.post(
  "/nearestpopularcars",
  validateRequest(carLocationSchema),
  getNearestPopularCars
);
router.get("/search", validateRequest(carSearchSchema), searchbynameornumber);
router.post("/search", validateRequest(carSearchSchema), searchbynameornumber);
router.get("/filter", validateRequest(carFilterSchema), filterCars);

// Protected routes (specific routes first)
router.get(
  "/getcar",
  verifyJWT,
  requireAdmin,
  validateRequest(paginationQuerySchema),
  getCar
);
router.post(
  "/add",
  verifyJWT,
  requireVendorOrAdmin,
  validateRequest(carCreateSchema),
  createCar
);

// Parameterized routes (after specific routes)
router.get("/getcar/:id", validateRequest(idParamSchema), getCarById);
router.get(
  "/carbyparking/:id",
  validateRequest({ ...idParamSchema, ...paginationQuerySchema }),
  getCarByParkingId
);
router.put("/:id", verifyJWT, requireVendorOrAdmin, updateCar);
router.delete(
  "/delete/:id",
  verifyJWT,
  requireVendorOrAdmin,
  validateRequest(idParamSchema),
  deleteCar
);

export default router;
