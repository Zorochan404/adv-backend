import { Router } from "express";
import { createParking, deleteParking, getNearByParking, getParking, getParkingByFilter, getParkingById, getParkingByIDadmin, updateParking } from "./parkingcontroller";
import { verifyJWT } from "../middleware/auth";

const parkingRouter = Router();

//user
parkingRouter.get("/get", getParking);
parkingRouter.get("/getnearby", getNearByParking);
parkingRouter.get("/getbyfilter", getParkingByFilter);
parkingRouter.get("/getbyid/:id", getParkingById);

//admin
parkingRouter.post("/add", verifyJWT, createParking);
parkingRouter.get("/getbyidadmin/:id", verifyJWT, getParkingByIDadmin);
parkingRouter.put("/update/:id", verifyJWT, updateParking);
parkingRouter.delete("/delete/:id", verifyJWT, deleteParking);

export default parkingRouter;