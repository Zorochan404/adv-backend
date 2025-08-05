import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Pool } from "pg";
import dotenv from "dotenv";
import {
  carModel,
  carRelations,
  carCatalogTable,
  carCatalogRelations,
} from "../modules/car/carmodel";
import { reviewModel, reviewRelations } from "../modules/review/reviewmodel";
import { UserTable, vendorRelations } from "../modules/user/usermodel";
import {
  parkingTable,
  parkingRelations,
} from "../modules/parking/parkingmodel";
import {
  bookingsTable,
  bookingRelations,
} from "../modules/booking/bookingmodel";
import {
  advertisementTable,
  advertisementRelations,
} from "../modules/advertisement/advertisementmodel";
import {
  topupTable,
  topupRelations,
  bookingTopupTable,
  bookingTopupRelations,
} from "../modules/booking/topupmodel";
import {
  picVerificationTable,
  picVerificationRelations,
} from "../modules/parking/picmodel";

dotenv.config();

// For Drizzle Studio and migrations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const schema = {
  carModel,
  carCatalogTable,
  reviewModel,
  UserTable,
  parkingTable,
  bookingsTable,
  advertisementTable,
  topupTable,
  bookingTopupTable,
  picVerificationTable,
  // Include all relations
  carRelations,
  carCatalogRelations,
  reviewRelations,
  vendorRelations,
  parkingRelations,
  bookingRelations,
  advertisementRelations,
  topupRelations,
  bookingTopupRelations,
  picVerificationRelations,
};

// For serverless operations
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });

// Export pool for Drizzle Studio
export { pool };
