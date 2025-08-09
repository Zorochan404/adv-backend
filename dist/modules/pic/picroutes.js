"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const piccontroller_1 = require("./piccontroller");
const router = (0, express_1.Router)();
// PIC-specific routes
router.get("/pickup-cars", auth_1.verifyJWT, auth_1.requirePIC, (0, validation_1.validateRequest)(validation_1.picDateFilterSchema), piccontroller_1.getPickupCars);
// Also support singular form for flexibility
router.get("/pickup-car", auth_1.verifyJWT, auth_1.requirePIC, (0, validation_1.validateRequest)(validation_1.picDateFilterSchema), piccontroller_1.getPickupCars);
router.get("/dropoff-cars", auth_1.verifyJWT, auth_1.requirePIC, (0, validation_1.validateRequest)(validation_1.picDateFilterSchema), piccontroller_1.getDropoffCars);
// Also support singular form for flexibility
router.get("/dropoff-car", auth_1.verifyJWT, auth_1.requirePIC, (0, validation_1.validateRequest)(validation_1.picDateFilterSchema), piccontroller_1.getDropoffCars);
exports.default = router;
//# sourceMappingURL=picroutes.js.map