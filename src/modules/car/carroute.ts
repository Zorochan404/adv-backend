import { Router } from "express";
import {
  createCar,
  getCar,
  getCarById,
  getCarByIdforadmin,
  updateCar,
  deletecar,
  getCarByAvailable,
  getCarByType,
  searchbynameornumber,
  getCarByApproved,
  getNearestCars,
  getNearestAvailableCars,
  getNearestPopularCars,
  getCarByParkingId,
} from "./carcontroller";
import { verifyJWT } from "../middleware/auth";

const carRouter = Router();

carRouter.get("/getcar", getCar);
carRouter.get("/getcar/:id", getCarById);
carRouter.get("/available", getCarByAvailable);
carRouter.get("/type", getCarByType);
carRouter.get("/search", searchbynameornumber);
carRouter.get("/nearestcars", getNearestCars);
carRouter.get("/nearestavailablecars", getNearestAvailableCars);
carRouter.get("/nearestpopularcars", getNearestPopularCars);
carRouter.get("/carbyparking/:id", getCarByParkingId);

//admin purpose
carRouter.get("/admin/:id", verifyJWT, getCarByIdforadmin);

//why jwt? not required. Already isAppproved false by default.
carRouter.post("/add", verifyJWT, createCar);
carRouter.put("/update/:id", verifyJWT, updateCar);
carRouter.delete("/delete/:id", verifyJWT, deletecar);
carRouter.get("/approved", verifyJWT, getCarByApproved);

export default carRouter;
