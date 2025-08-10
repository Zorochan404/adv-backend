import express, { Router } from "express";
import {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  searchUser,
  getUserbyrole,
  addParkingIncharge,
  getusersbyvendor,
  addvendor,
  getParkingInchargeByNumber,
  assignParkingIncharge,
  getParkingInchargeByParkingId,
  updatePassword,
} from "./usercontroller";
import {
  verifyJWT,
  requireAdmin,
  requireOwnerOrAdmin,
  requireUser,
} from "../middleware/auth";
import {
  validateRequest,
  idParamSchema,
  carIdParamSchema,
  reviewIdParamSchema,
  parkingIdParamSchema,
  userCreateSchema,
  userUpdateSchema,
  userSearchSchema,
  userRoleSchema,
  parkingInchargeAssignSchema,
  parkingInchargeByNumberSchema,
  paginationQuerySchema,
  passwordUpdateSchema,
} from "../utils/validation";

const router: Router = express.Router();

// Public routes (no authentication required)
router.get("/getuser/:id", validateRequest(idParamSchema), getUser);
router.get("/getallusers", validateRequest(paginationQuerySchema), getAllUsers);
router.get("/search", validateRequest(userSearchSchema), searchUser);
router.post("/getuserbyrole", validateRequest(userRoleSchema), getUserbyrole);

// Admin-only routes (for user management)
router.post(
  "/addparkingincharge",
  verifyJWT,
  requireAdmin,
  validateRequest(userCreateSchema),
  addParkingIncharge
);
router.get(
  "/getusersbyvendor",
  verifyJWT,
  requireAdmin,
  validateRequest(paginationQuerySchema),
  getusersbyvendor
);
router.post(
  "/addvendor",
  verifyJWT,
  requireAdmin,
  validateRequest(userCreateSchema),
  addvendor
);
router.post(
  "/getparkinginchargebynumber",
  verifyJWT,
  requireAdmin,
  validateRequest(parkingInchargeByNumberSchema),
  getParkingInchargeByNumber
);
router.post(
  "/assignparkingincharge",
  verifyJWT,
  requireAdmin,
  validateRequest(parkingInchargeAssignSchema),
  assignParkingIncharge
);
router.get(
  "/getparkinginchargebyparkingid/:parkingid",
  verifyJWT,
  requireAdmin,
  validateRequest(parkingIdParamSchema),
  getParkingInchargeByParkingId
);

// Owner or Admin routes (for updating/deleting users)
router.put(
  "/updateuser/:id",
  // verifyJWT,
  // requireOwnerOrAdmin,
  validateRequest({ ...idParamSchema, ...userUpdateSchema }),
  updateUser
);
router.delete(
  "/deleteuser/:id",
  verifyJWT,
  requireOwnerOrAdmin,
  validateRequest(idParamSchema),
  deleteUser
);

// Password update route (for all authenticated users)
router.put(
  "/update-password",
  verifyJWT,
  requireUser,
  validateRequest(passwordUpdateSchema),
  updatePassword
);

export default router;
