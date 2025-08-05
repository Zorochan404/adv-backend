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
import { verifyJWT } from "../middleware/auth";

const carCatalogRouter: Router = Router();

// Public routes (no authentication required)
carCatalogRouter.get("/active", getActiveCarCatalog);
carCatalogRouter.get("/:id", getCarCatalogById);

// Protected routes (require authentication)
carCatalogRouter.post("/create", verifyJWT, createCarCatalog);
carCatalogRouter.get("/admin/all", verifyJWT, getAllCarCatalog);
carCatalogRouter.put("/:id", verifyJWT, updateCarCatalog);
carCatalogRouter.delete("/:id", verifyJWT, deleteCarCatalog);
carCatalogRouter.post("/seed", verifyJWT, seedCarCatalog);

export default carCatalogRouter;
