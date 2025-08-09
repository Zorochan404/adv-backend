"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const carcatalogcontroller_1 = require("./carcatalogcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get("/active", carcatalogcontroller_1.getActiveCarCatalog);
router.get("/categories", carcatalogcontroller_1.getAllCarCategories);
router.get("/:id", (0, validation_1.validateRequest)(validation_1.idParamSchema), carcatalogcontroller_1.getCarCatalogById);
// Admin-only routes
router.post("/create", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.carCatalogCreateSchema), carcatalogcontroller_1.createCarCatalog);
router.get("/admin/all", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)({ ...validation_1.carCatalogFilterSchema, ...validation_1.paginationQuerySchema }), carcatalogcontroller_1.getAllCarCatalog);
router.put("/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)({ ...validation_1.idParamSchema, ...validation_1.carCatalogUpdateSchema }), carcatalogcontroller_1.updateCarCatalog);
router.delete("/:id", auth_1.verifyJWT, auth_1.requireAdmin, (0, validation_1.validateRequest)(validation_1.idParamSchema), carcatalogcontroller_1.deleteCarCatalog);
router.post("/seed", auth_1.verifyJWT, auth_1.requireAdmin, carcatalogcontroller_1.seedCarCatalog);
router.post("/update-late-fees", auth_1.verifyJWT, auth_1.requireAdmin, carcatalogcontroller_1.updateCarCatalogLateFees);
exports.default = router;
//# sourceMappingURL=carcatalogroutes.js.map