import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { carModel, carRelations } from '../modules/car/carmodel';
import { reviewModel, reviewRelations } from '../modules/review/reviewmodel';
import { UserTable, vendorRelations } from '../modules/user/usermodel';
import { parkingTable, parkingRelations } from '../modules/parking/parkingmodel';
import { bookingsTable, bookingRelations } from '../modules/booking/bookingmodel';
dotenv.config();

// For Drizzle Studio and migrations
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


const schema = {
  carModel,
  reviewModel,
  UserTable,
  parkingTable,
  bookingsTable,
  // Include all relations
  carRelations,
  reviewRelations,
  vendorRelations,
  parkingRelations,
  bookingRelations,
};

// For serverless operations
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });

// Export pool for Drizzle Studio
export { pool };