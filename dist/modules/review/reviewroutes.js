"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewcontroller_1 = require("./reviewcontroller");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get("/getreviews", (0, validation_1.validateRequest)(validation_1.reviewQuerySchema), reviewcontroller_1.getreviews);
router.get("/getreviewsbycars/:carid", (0, validation_1.validateRequest)({ ...validation_1.carIdParamSchema, ...validation_1.reviewQuerySchema }), reviewcontroller_1.getreviewsbycars);
router.get("/avg-rating/:carid", (0, validation_1.validateRequest)(validation_1.carIdParamSchema), reviewcontroller_1.getavgratingbycars);
// User-only routes (for creating reviews)
router.post("/addreview/:carid", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)({ ...validation_1.carIdParamSchema, ...validation_1.reviewCreateSchema }), reviewcontroller_1.addreview);
// Owner or Admin routes (for updating/deleting reviews)
router.put("/updatereview/:reviewid", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)({ ...validation_1.reviewIdParamSchema, ...validation_1.reviewUpdateSchema }), reviewcontroller_1.updatereview);
router.delete("/deletereview/:reviewid", auth_1.verifyJWT, auth_1.requireUser, (0, validation_1.validateRequest)(validation_1.reviewIdParamSchema), reviewcontroller_1.deletereview);
exports.default = router;
//# sourceMappingURL=reviewroutes.js.map