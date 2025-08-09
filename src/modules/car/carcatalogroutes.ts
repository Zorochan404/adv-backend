import express, { Router } from "express";
import {
  createCarCatalog,
  getAllCarCatalog,
  getCarCatalogById,
  updateCarCatalog,
  deleteCarCatalog,
  getActiveCarCatalog,
  seedCarCatalog,
  updateCarCatalogLateFees,
  getAllCarCategories,
} from "./carcatalogcontroller";
import { verifyJWT, requireAdmin } from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  carCatalogCreateSchema,
  carCatalogUpdateSchema,
  carCatalogFilterSchema,
  paginationQuerySchema,
} from "../utils/validation";

const router: Router = express.Router();

// Public routes (no authentication required)
router.get("/active", getActiveCarCatalog);
router.get("/categories", getAllCarCategories);
router.get("/:id", validateRequest(idParamSchema), getCarCatalogById);

// Admin-only routes
router.post(
  "/create",
  verifyJWT,
  requireAdmin,
  validateRequest(carCatalogCreateSchema),
  createCarCatalog
);
router.get(
  "/admin/all",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...carCatalogFilterSchema, ...paginationQuerySchema }),
  getAllCarCatalog
);
router.put(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest({ ...idParamSchema, ...carCatalogUpdateSchema }),
  updateCarCatalog
);
router.delete(
  "/:id",
  verifyJWT,
  requireAdmin,
  validateRequest(idParamSchema),
  deleteCarCatalog
);
router.post("/seed", verifyJWT, requireAdmin, seedCarCatalog);
router.post(
  "/update-late-fees",
  verifyJWT,
  requireAdmin,
  updateCarCatalogLateFees
);

export default router;
