"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const advertisementcontroller_1 = require("./advertisementcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes
router.get("/active", (0, validation_1.validateRequest)(validation_1.advertisementFilterSchema), advertisementcontroller_1.getActiveAdvertisements);
// Create advertisement (admin only)
router.post("/create", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.advertisementCreateSchema), advertisementcontroller_1.createAdvertisement);
// Admin routes
router.get("/admin/all", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)({ ...validation_1.advertisementFilterSchema, ...validation_1.paginationQuerySchema }), advertisementcontroller_1.getAllAdvertisements);
router.get("/admin/stats", auth_1.verifyJWT, auth_1.requireAdmin, advertisementcontroller_1.getAdvertisementStats);
// Parameterized routes (must come after specific routes)
router.post("/:id/view", (0, validation_1.validateRequest)(validation_1.idParamSchema), advertisementcontroller_1.incrementViewCount);
router.post("/:id/click", (0, validation_1.validateRequest)(validation_1.idParamSchema), advertisementcontroller_1.incrementClickCount);
router.get("/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), advertisementcontroller_1.getAdvertisementById);
router.put("/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)({ ...validation_1.idParamSchema, ...validation_1.advertisementUpdateSchema }), advertisementcontroller_1.updateAdvertisement);
router.delete("/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), advertisementcontroller_1.deleteAdvertisement);
exports.default = router;
//# sourceMappingURL=advertisementroutes.js.map