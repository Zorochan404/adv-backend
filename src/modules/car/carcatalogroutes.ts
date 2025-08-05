import { Router } from "express";
import {
  createCarCatalog,
  getAllCarCatalog,
  getCarCatalogById,
  updateCarCatalog,
  deleteCarCatalog,
  getActiveCarCatalog,
  seedCarCatalog,
} from "./carcatalogcontroller";
import { verifyJWT, requireAdmin } from "../middleware/auth";

const carCatalogRouter: Router = Router();

// Public routes (no authentication required)
carCatalogRouter.get("/active", getActiveCarCatalog);
carCatalogRouter.get("/:id", getCarCatalogById);

// Admin-only routes
carCatalogRouter.post("/create", verifyJWT, requireAdmin, createCarCatalog);
carCatalogRouter.get("/admin/all", verifyJWT, requireAdmin, getAllCarCatalog);
carCatalogRouter.put("/:id", verifyJWT, requireAdmin, updateCarCatalog);
carCatalogRouter.delete("/:id", verifyJWT, requireAdmin, deleteCarCatalog);
carCatalogRouter.post("/seed", verifyJWT, requireAdmin, seedCarCatalog);

export default carCatalogRouter;
