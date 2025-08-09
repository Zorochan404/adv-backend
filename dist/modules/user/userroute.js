"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const usercontroller_1 = require("./usercontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get("/getuser/:id", (0, validation_1.validateRequest)(validation_1.idParamSchema), usercontroller_1.getUser);
router.get("/getallusers", (0, validation_1.validateRequest)(validation_1.paginationQuerySchema), usercontroller_1.getAllUsers);
router.get("/search", (0, validation_1.validateRequest)(validation_1.userSearchSchema), usercontroller_1.searchUser);
router.post("/getuserbyrole", (0, validation_1.validateRequest)(validation_1.userRoleSchema), usercontroller_1.getUserbyrole);
// Admin-only routes (for user management)
router.post("/addparkingincharge", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.userCreateSchema), usercontroller_1.addParkingIncharge);
router.get("/getusersbyvendor", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.paginationQuerySchema), usercontroller_1.getusersbyvendor);
router.post("/addvendor", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.userCreateSchema), usercontroller_1.addvendor);
router.post("/getparkinginchargebynumber", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.parkingInchargeByNumberSchema), usercontroller_1.getParkingInchargeByNumber);
router.post("/assignparkingincharge", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.parkingInchargeAssignSchema), usercontroller_1.assignParkingIncharge);
router.get("/getparkinginchargebyparkingid/:parkingid", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.parkingIdParamSchema), usercontroller_1.getParkingInchargeByParkingId);
// Owner or Admin routes (for updating/deleting users)
router.put("/updateuser/:id", auth_1.verifyJWT, auth_1.requireOwnerOrAdmin, (0, validation_1.validateRequest)({ ...validation_1.idParamSchema, ...validation_1.userUpdateSchema }), usercontroller_1.updateUser);
router.delete("/deleteuser/:id", auth_1.verifyJWT, auth_1.requireOwnerOrAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), usercontroller_1.deleteUser);
// Password update route (for all authenticated users)
router.put("/update-password", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.passwordUpdateSchema), usercontroller_1.updatePassword);
exports.default = router;
//# sourceMappingURL=userroute.js.map