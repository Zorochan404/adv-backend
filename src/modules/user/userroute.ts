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
import {
  verifyJWT,
  requireAdmin,
  requireVendorOrAdmin,
  requireOwnerOrAdmin,
} from "../middleware/auth";

const router: Router = Router();

// Public routes (no authentication required)
router.get("/getuser/:id", getUser);
router.get("/getallusers", getAllUsers);
router.post("/searchuser", searchUser);
router.post("/getuserbyrole", getUserbyrole);

// Admin-only routes (for user management)
router.post("/addparkingincharge", verifyJWT, requireAdmin, addParkingIncharge);
router.get("/getusersbyvendor", verifyJWT, requireAdmin, getusersbyvendor);
router.post("/addvendor", verifyJWT, requireAdmin, addvendor);
router.post(
  "/getparkinginchargebynumber",
  verifyJWT,
  requireAdmin,
  getParkingInchargeByNumber
);
router.post(
  "/assignparkingincharge",
  verifyJWT,
  requireAdmin,
  assignParkingIncharge
);
router.get(
  "/getparkinginchargebyparkingid/:parkingid",
  verifyJWT,
  requireAdmin,
  getParkingInchargeByParkingId
);

// Owner or Admin routes (for updating/deleting users)
router.put("/updateuser/:id", verifyJWT, requireOwnerOrAdmin, updateUser);
router.delete("/deleteuser/:id", verifyJWT, requireOwnerOrAdmin, deleteUser);

export default router;
