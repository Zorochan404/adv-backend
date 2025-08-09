"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.db = void 0;
const serverless_1 = require("@neondatabase/serverless");
const neon_http_1 = require("drizzle-orm/neon-http");
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const carmodel_1 = require("../modules/car/carmodel");
const reviewmodel_1 = require("../modules/review/reviewmodel");
const usermodel_1 = require("../modules/user/usermodel");
const parkingmodel_1 = require("../modules/parking/parkingmodel");
const bookingmodel_1 = require("../modules/booking/bookingmodel");
const advertisementmodel_1 = require("../modules/advertisement/advertisementmodel");
const topupmodel_1 = require("../modules/booking/topupmodel");
const picmodel_1 = require("../modules/parking/picmodel");
dotenv_1.default.config();
// For Drizzle Studio and migrations
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
exports.pool = pool;
const schema = {
    carModel: carmodel_1.carModel,
    carCatalogTable: carmodel_1.carCatalogTable,
    reviewModel: reviewmodel_1.reviewModel,
    UserTable: usermodel_1.UserTable,
    parkingTable: parkingmodel_1.parkingTable,
    bookingsTable: bookingmodel_1.bookingsTable,
    advertisementTable: advertisementmodel_1.advertisementTable,
    topupTable: topupmodel_1.topupTable,
    bookingTopupTable: topupmodel_1.bookingTopupTable,
    picVerificationTable: picmodel_1.picVerificationTable,
    // Include all relations
    carRelations: carmodel_1.carRelations,
    carCatalogRelations: carmodel_1.carCatalogRelations,
    reviewRelations: reviewmodel_1.reviewRelations,
    vendorRelations: usermodel_1.vendorRelations,
    parkingRelations: parkingmodel_1.parkingRelations,
    bookingRelations: bookingmodel_1.bookingRelations,
    advertisementRelations: advertisementmodel_1.advertisementRelations,
    topupRelations: topupmodel_1.topupRelations,
    bookingTopupRelations: topupmodel_1.bookingTopupRelations,
    picVerificationRelations: picmodel_1.picVerificationRelations,
};
// For serverless operations
const sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
exports.db = (0, neon_http_1.drizzle)({ client: sql, schema });
//# sourceMappingURL=db.js.map