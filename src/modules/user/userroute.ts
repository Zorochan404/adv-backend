import { Router } from "express";
import {
  getUser,
  updateUser,
  deleteUser,
  searchUser,
  getAllUsers,
  getUserbyrole,
  addParkingIncharge,
  getusersbyvendor,
  addvendor,
  getParkingInchargeByNumber,
  assignParkingIncharge,
  getParkingInchargeByParkingId,
} from "./usercontroller";
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.get("/getuser/:id", getUser);
router.get("/getallusers", getAllUsers);
router.put("/updateuser/:id", updateUser);
router.delete("/deleteuser/:id", deleteUser);
router.post("/searchuser", searchUser);
router.post("/getuserbyrole", getUserbyrole);
router.post("/addparkingincharge", verifyJWT, addParkingIncharge);
router.get("/getusersbyvendor", verifyJWT, getusersbyvendor);

//who is adding the vendor why jwt?
router.post("/addvendor", addvendor);
router.post(
  "/getparkinginchargebynumber",
  verifyJWT,
  getParkingInchargeByNumber
);
router.post("/assignparkingincharge", verifyJWT, assignParkingIncharge);
router.get(
  "/getparkinginchargebyparkingid/:parkingid",
  verifyJWT,
  getParkingInchargeByParkingId
);

export default router;
