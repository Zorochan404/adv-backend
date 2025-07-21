import { Router } from "express";
import { getUser, updateUser, deleteUser, searchUser, getAllUsers, getUserbyrole, addParkingIncharge, getusersbyvendor } from "./usercontroller";
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.get("/getuser/:id", getUser);
router.get("/getallusers", getAllUsers);
router.put("/updateuser/:id", updateUser);
router.delete("/deleteuser/:id", deleteUser);
router.post("/searchuser", searchUser);
router.post("/getuserbyrole", getUserbyrole);
router.put("/addparkingincharge", verifyJWT, addParkingIncharge);
router.get("/getusersbyvendor", verifyJWT, getusersbyvendor);

export default router;