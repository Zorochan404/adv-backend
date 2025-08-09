"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authcontroller_1 = require("./authcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes
router.post("/login", (0, validation_1.validateRequest)(validation_1.loginSchema), authcontroller_1.loginuser);
router.post("/registerAdmin", auth_1.verifyJWT, (0, validation_1.validateRequest)(validation_1.adminRegisterSchema), authcontroller_1.registerAdmin);
router.post("/loginAdmin", (0, validation_1.validateRequest)(validation_1.adminLoginSchema), authcontroller_1.loginAdmin);
// Admin-only routes
router.post("/migrate-passwords", auth_1.verifyJWT, auth_1.requireAdmin, authcontroller_1.migratePasswords);
exports.default = router;
//# sourceMappingURL=authroutes.js.map