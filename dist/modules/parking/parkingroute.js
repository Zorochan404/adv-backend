"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const parkingcontroller_1 = require("./parkingcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get("/get", (0, validation_1.validateRequest)(validation_1.parkingFilterSchema), parkingcontroller_1.getParking);
router.get("/search", (0, validation_1.validateRequest)(validation_1.parkingFilterSchema), parkingcontroller_1.getParkingByFilter);
router.get("/getbyid/:id", (0, validation_1.validateRequest)(validation_1.idParamSchema), parkingcontroller_1.getParkingById);
router.get("/nearby", (0, validation_1.validateRequest)(validation_1.parkingLocationSchema), parkingcontroller_1.getNearByParking);
router.post("/nearby", (0, validation_1.validateRequest)(validation_1.parkingLocationSchema), parkingcontroller_1.getNearByParking);
// Admin-only routes (for parking management)
router.post("/add", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.parkingCreateSchema), parkingcontroller_1.createParking);
router.get("/getbyidadmin/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), parkingcontroller_1.getParkingByIDadmin);
router.put("/update/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)({ ...validation_1.idParamSchema, ...validation_1.parkingUpdateSchema }), parkingcontroller_1.updateParking);
router.delete("/delete/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), parkingcontroller_1.deleteParking);
exports.default = router;
//# sourceMappingURL=parkingroute.js.map