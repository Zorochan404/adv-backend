"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const carcontroller_1 = require("./carcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes (specific routes first)
router.get("/test", carcontroller_1.testCarConnection);
router.get("/nearestcars", (0, validation_1.validateRequest)(validation_1.carLocationSchema), carcontroller_1.getNearestCars);
router.post("/nearestcars", (0, validation_1.validateRequest)(validation_1.carLocationSchema), carcontroller_1.getNearestCars);
router.get("/nearestavailablecars", (0, validation_1.validateRequest)(validation_1.carLocationSchema), carcontroller_1.getNearestAvailableCars);
router.post("/nearestavailablecars", (0, validation_1.validateRequest)(validation_1.carLocationSchema), carcontroller_1.getNearestAvailableCars);
router.get("/nearestpopularcars", (0, validation_1.validateRequest)(validation_1.carLocationSchema), carcontroller_1.getNearestPopularCars);
router.post("/nearestpopularcars", (0, validation_1.validateRequest)(validation_1.carLocationSchema), carcontroller_1.getNearestPopularCars);
router.get("/search", (0, validation_1.validateRequest)(validation_1.carSearchSchema), carcontroller_1.searchbynameornumber);
router.post("/search", (0, validation_1.validateRequest)(validation_1.carSearchSchema), carcontroller_1.searchbynameornumber);
router.get("/filter", (0, validation_1.validateRequest)(validation_1.carFilterSchema), carcontroller_1.filterCars);
// Protected routes (specific routes first)
router.get("/getcar", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.paginationQuerySchema), carcontroller_1.getCar);
router.post("/add", auth_1.verifyJWT, auth_1.requireVendorOrAdmin, (0, validation_1.validateRequest)(validation_1.carCreateSchema), carcontroller_1.createCar);
// Parameterized routes (after specific routes)
router.get("/getcar/:id", (0, validation_1.validateRequest)(validation_1.idParamSchema), carcontroller_1.getCarById);
router.get("/carbyparking/:id", (0, validation_1.validateRequest)({ ...validation_1.idParamSchema, ...validation_1.paginationQuerySchema }), carcontroller_1.getCarByParkingId);
router.put("/:id", auth_1.verifyJWT, auth_1.requireVendorOrAdmin, carcontroller_1.updateCar);
router.delete("/delete/:id", auth_1.verifyJWT, auth_1.requireVendorOrAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), carcontroller_1.deleteCar);
exports.default = router;
//# sourceMappingURL=carroute.js.map