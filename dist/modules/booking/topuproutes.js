"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const topupcontroller_1 = require("./topupcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes
router.get("/active", topupcontroller_1.getActiveTopups);
// User routes
router.post("/apply", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.topupApplySchema), topupcontroller_1.applyTopupToBooking);
router.get("/booking/:bookingId", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.idParamSchema), topupcontroller_1.getBookingTopups);
// Admin routes
router.get("/", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.paginationQuerySchema), topupcontroller_1.getAllTopups);
router.post("/", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.topupCreateSchema), topupcontroller_1.createTopup);
router.put("/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)({ ...validation_1.idParamSchema, ...validation_1.topupUpdateSchema }), topupcontroller_1.updateTopup);
router.delete("/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), topupcontroller_1.deleteTopup);
exports.default = router;
//# sourceMappingURL=topuproutes.js.map