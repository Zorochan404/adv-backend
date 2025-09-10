import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';

// Disable TestContainers reaper to avoid connection issues
process.env.TESTCONTAINERS_RYUK_DISABLED = 'true';

// Import the schema from the main app
import {
  carModel,
  carRelations,
  carCatalogTable,
  carCatalogRelations,
} from '../src/modules/car/carmodel';
import { reviewModel, reviewRelations } from '../src/modules/review/reviewmodel';
import { UserTable, vendorRelations } from '../src/modules/user/usermodel';
import {
  parkingTable,
  parkingRelations,
} from '../src/modules/parking/parkingmodel';
import {
  bookingsTable,
  bookingRelations,
} from '../src/modules/booking/bookingmodel';
import {
  advertisementTable,
  advertisementRelations,
} from '../src/modules/advertisement/advertisementmodel';
import {
  couponTable,
  couponRelations,
} from '../src/modules/coupon/couponmodel';
import {
  topupTable,
  topupRelations,
  bookingTopupTable,
  bookingTopupRelations,
} from '../src/modules/booking/topupmodel';
import {
  picVerificationTable,
  picVerificationRelations,
} from '../src/modules/parking/picmodel';
import {
  paymentsTable,
  paymentSummaryTable,
  paymentRelations,
  paymentSummaryRelations,
  bookingPaymentRelations,
} from '../src/modules/payment/paymentmodel';

let postgresContainer: StartedPostgreSqlContainer;
let originalEnv: Record<string, string | undefined>;
let testDb: ReturnType<typeof drizzle>;
let testSql: ReturnType<typeof postgres>;

export const setupTestDatabase = async () => {
  // Store original environment variables
  originalEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
  };

  try {
    // Start PostgreSQL container
    postgresContainer = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testdb')
      .withUsername('testuser')
      .withPassword('testpass')
      .withExposedPorts(5432)
      .start();

    // Set environment variables for the test database
    const host = postgresContainer.getHost();
    const port = postgresContainer.getMappedPort(5432);
    const databaseUrl = `postgresql://testuser:testpass@${host}:${port}/testdb`;

    process.env.DATABASE_URL = databaseUrl;
    process.env.DB_HOST = host;
    process.env.DB_PORT = port.toString();
    process.env.DB_NAME = 'testdb';
    process.env.DB_USER = 'testuser';
    process.env.DB_PASSWORD = 'testpass';

    console.log('Test PostgreSQL container started');
    console.log(`Database URL: ${databaseUrl}`);

    // Create test database connection
    testSql = postgres(databaseUrl, { max: 1 });
    testDb = drizzle(testSql);

    // Override the main app's database connection
    await overrideMainAppDatabase(databaseUrl);

    // Run migrations
    await runMigrations(databaseUrl);

    return {
      host,
      port,
      databaseUrl,
      db: testDb,
    };
  } catch (error) {
    console.error('Failed to start PostgreSQL container:', error);
    throw error;
  }
};

export const teardownTestDatabase = async () => {
  // Close test database connection
  if (testSql) {
    await testSql.end();
    testSql = null as any;
    testDb = null as any;
  }

  // Stop and remove the container
  if (postgresContainer) {
    await postgresContainer.stop();
    console.log('Test PostgreSQL container stopped');
  }

  // Restore original environment variables
  if (originalEnv) {
    Object.keys(originalEnv).forEach(key => {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    });
  }
};

const overrideMainAppDatabase = async (databaseUrl: string) => {
  try {
    // Import the main app's database module
    const dbModule = await import('../src/drizzle/db');
    
    // Create a new test database connection using the same schema as the main app
    const testSql = postgres(databaseUrl, { max: 1 });
    const testDb = drizzle(testSql, {
      schema: {
        carModel,
        carCatalogTable,
        reviewModel,
        UserTable,
        parkingTable,
        bookingsTable,
        advertisementTable,
        couponTable,
        topupTable,
        bookingTopupTable,
        picVerificationTable,
        paymentsTable,
        paymentSummaryTable,
        // Include all relations
        carRelations,
        carCatalogRelations,
        reviewRelations,
        vendorRelations,
        parkingRelations,
        bookingRelations,
        advertisementRelations,
        couponRelations,
        topupRelations,
        bookingTopupRelations,
        picVerificationRelations,
        paymentRelations,
        paymentSummaryRelations,
        bookingPaymentRelations,
      }
    });
    
    // Override the exported db object
    Object.assign(dbModule, { db: testDb });
    
    console.log('Main app database connection overridden for tests');
  } catch (error) {
    console.error('Failed to override main app database:', error);
    throw error;
  }
};

const runMigrations = async (databaseUrl: string) => {
  try {
    // Option 1: Use Drizzle migrations (Recommended for production)
    await runDrizzleMigrations(databaseUrl);
    
    // Option 2: Fallback to manual schema (uncomment if migrations fail)
    // await createManualSchema(databaseUrl);
    
    console.log('Test database schema created successfully');
  } catch (error) {
    console.error('Failed to create test schema:', error);
    throw error;
  }
};

// Production approach: Use actual Drizzle migrations
const runDrizzleMigrations = async (databaseUrl: string) => {
  try {
    const sql = postgres(databaseUrl, { max: 1 });
    const db = drizzle(sql);
    
    // Run migrations from the migrations folder
    await migrate(db, { 
      migrationsFolder: path.join(__dirname, '../src/drizzle/migrations') 
    });
    
    await sql.end();
    console.log('Drizzle migrations applied successfully');
  } catch (error) {
    console.error('Failed to run Drizzle migrations:', error);
    // Fallback to manual schema creation
    console.log('Falling back to manual schema creation...');
    await createManualSchema(databaseUrl);
  }
};

// Fallback: Manual schema creation (current approach)
const createManualSchema = async (databaseUrl: string) => {
  const sql = postgres(databaseUrl, { max: 1 });
  
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      avatar VARCHAR(255),
      age INTEGER,
      number BIGINT,
      email VARCHAR(255),
      password VARCHAR(255) DEFAULT '123456',
      aadhar_number VARCHAR(255),
      aadhar_img VARCHAR(255),
      dl_number VARCHAR(255),
      dl_img VARCHAR(255),
      passport_number VARCHAR(255),
      passport_img VARCHAR(255),
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      locality VARCHAR(255),
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255),
      pincode INTEGER,
      role VARCHAR(50) DEFAULT 'user',
      is_verified BOOLEAN DEFAULT false,
      parkingid INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS parkings (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      locality VARCHAR(255),
      city VARCHAR(255),
      state VARCHAR(255),
      country VARCHAR(255),
      pincode INTEGER,
      capacity INTEGER NOT NULL,
      mainimg VARCHAR(255) NOT NULL,
      images JSONB NOT NULL DEFAULT '[]',
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  await sql`
    CREATE TABLE IF NOT EXISTS car_catalog (
      id SERIAL PRIMARY KEY,
      car_name VARCHAR(255) NOT NULL,
      car_maker VARCHAR(255) NOT NULL,
      car_model_year INTEGER NOT NULL,
      car_vendor_price DECIMAL(10,2) NOT NULL,
      car_platform_price DECIMAL(10,2) NOT NULL,
      transmission VARCHAR(20) DEFAULT 'manual',
      fuel_type VARCHAR(20) DEFAULT 'petrol',
      seats INTEGER DEFAULT 5,
      engine_capacity VARCHAR(50),
      mileage VARCHAR(50),
      features VARCHAR(1000),
      image_url VARCHAR(500),
      is_active BOOLEAN DEFAULT true,
      category VARCHAR(100) DEFAULT 'sedan',
      late_fee_rate DECIMAL(10,2) DEFAULT 0.10,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS car (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      number VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL,
      discountprice INTEGER DEFAULT 0,
      color VARCHAR(255) NOT NULL,
      rcnumber VARCHAR(255),
      rcimg VARCHAR(255),
      pollutionimg VARCHAR(255),
      insuranceimg VARCHAR(255),
      inmaintainance BOOLEAN DEFAULT false,
      isavailable BOOLEAN DEFAULT true,
      insurance_amount DECIMAL(10,2) DEFAULT 500,
      images VARCHAR(255)[] DEFAULT '{}',
      vendorid INTEGER NOT NULL,
      parkingid INTEGER,
      catalog_id INTEGER,
      status VARCHAR(50) DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

                await sql`
                  CREATE TABLE IF NOT EXISTS bookings (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    car_id INTEGER NOT NULL,
                    coupon_id INTEGER,
                    start_date TIMESTAMP NOT NULL,
                    end_date TIMESTAMP NOT NULL,
                    pickup_date TIMESTAMP,
                    actual_pickup_date TIMESTAMP,
                    actual_dropoff_date TIMESTAMP,
                    original_pickup_date TIMESTAMP,
                    reschedule_count INTEGER DEFAULT 0,
                    max_reschedule_count INTEGER DEFAULT 3,
                    base_price DOUBLE PRECISION NOT NULL,
                    advance_amount DOUBLE PRECISION NOT NULL,
                    remaining_amount DOUBLE PRECISION NOT NULL,
                    total_price DOUBLE PRECISION NOT NULL,
                    discount_amount DOUBLE PRECISION DEFAULT 0,
                    insurance_amount DOUBLE PRECISION DEFAULT 0,
                    extension_price DOUBLE PRECISION DEFAULT 0,
                    extension_till TIMESTAMP,
                    extension_time INTEGER,
                    late_fees DOUBLE PRECISION DEFAULT 0,
                    return_condition VARCHAR(50) DEFAULT 'good',
                    return_images VARCHAR(255)[] DEFAULT '{}',
                    return_comments VARCHAR(500),
                    status VARCHAR(50) DEFAULT 'pending',
                    confirmation_status VARCHAR(50) DEFAULT 'pending',
                    advance_payment_id INTEGER,
                    final_payment_id INTEGER,
                    late_fees_payment_id INTEGER,
                    car_condition_images VARCHAR(255)[] DEFAULT '{}',
                    tool_images VARCHAR(255)[] DEFAULT '{}',
                    tools JSONB DEFAULT '[]',
                    pic_approved BOOLEAN DEFAULT false,
                    pic_approved_at TIMESTAMP,
                    pic_approved_by INTEGER,
                    pic_comments VARCHAR(500),
                    otp_code VARCHAR(4),
                    otp_expires_at TIMESTAMP,
                    otp_verified BOOLEAN DEFAULT false,
                    otp_verified_at TIMESTAMP,
                    otp_verified_by INTEGER,
                    user_confirmed BOOLEAN DEFAULT false,
                    user_confirmed_at TIMESTAMP,
                    pickup_parking_id INTEGER,
                    dropoff_parking_id INTEGER,
                    delivery_type VARCHAR(50) DEFAULT 'pickup',
                    delivery_address VARCHAR(500),
                    delivery_charges DOUBLE PRECISION DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                `;

  await sql`
    CREATE TABLE IF NOT EXISTS topups (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description VARCHAR(500),
      duration INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      category VARCHAR(100) DEFAULT 'extension',
      is_active BOOLEAN DEFAULT true,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

                await sql`
                  CREATE TABLE IF NOT EXISTS coupons (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(50) UNIQUE NOT NULL,
                    description VARCHAR(500),
                    discount_type VARCHAR(20) DEFAULT 'percentage',
                    discount_value DECIMAL(10,2) NOT NULL,
                    min_amount DECIMAL(10,2) DEFAULT 0,
                    max_discount DECIMAL(10,2),
                    usage_limit INTEGER,
                    used_count INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT true,
                    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    valid_until TIMESTAMP,
                    created_by INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                `;

                // Create payment types enum
                await sql`
                  DO $$ BEGIN
                    CREATE TYPE payment_type AS ENUM ('advance', 'final', 'late_fees', 'topup', 'refund', 'penalty');
                  EXCEPTION
                    WHEN duplicate_object THEN null;
                  END $$;
                `;

                // Create payment status enum
                await sql`
                  DO $$ BEGIN
                    CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');
                  EXCEPTION
                    WHEN duplicate_object THEN null;
                  END $$;
                `;

                // Create payment method enum
                await sql`
                  DO $$ BEGIN
                    CREATE TYPE payment_method AS ENUM ('razorpay', 'stripe', 'paypal', 'upi', 'card', 'netbanking', 'wallet', 'cash');
                  EXCEPTION
                    WHEN duplicate_object THEN null;
                  END $$;
                `;

                await sql`
                  CREATE TABLE IF NOT EXISTS payments (
                    id SERIAL PRIMARY KEY,
                    payment_id VARCHAR(100) NOT NULL UNIQUE,
                    reference_id VARCHAR(100),
                    type payment_type NOT NULL,
                    status payment_status DEFAULT 'pending',
                    method payment_method NOT NULL,
                    amount DOUBLE PRECISION NOT NULL,
                    currency VARCHAR(3) DEFAULT 'INR',
                    fees DOUBLE PRECISION DEFAULT 0,
                    net_amount DOUBLE PRECISION NOT NULL,
                    user_id INTEGER NOT NULL,
                    booking_id INTEGER,
                    topup_id INTEGER,
                    gateway_transaction_id VARCHAR(200),
                    gateway_response VARCHAR(1000),
                    gateway_status VARCHAR(50),
                    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    processed_at TIMESTAMP,
                    completed_at TIMESTAMP,
                    failed_at TIMESTAMP,
                    failure_reason VARCHAR(500),
                    retry_count INTEGER DEFAULT 0,
                    refund_amount DOUBLE PRECISION DEFAULT 0,
                    refund_reason VARCHAR(500),
                    refunded_at TIMESTAMP,
                    refund_reference_id VARCHAR(100),
                    metadata VARCHAR(1000),
                    notes VARCHAR(500),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                `;

                await sql`
                  CREATE TABLE IF NOT EXISTS payment_summary (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    booking_id INTEGER,
                    total_paid DOUBLE PRECISION DEFAULT 0,
                    total_refunded DOUBLE PRECISION DEFAULT 0,
                    net_amount DOUBLE PRECISION DEFAULT 0,
                    total_payments INTEGER DEFAULT 0,
                    successful_payments INTEGER DEFAULT 0,
                    failed_payments INTEGER DEFAULT 0,
                    last_payment_at TIMESTAMP,
                    last_payment_amount DOUBLE PRECISION,
                    last_payment_status payment_status,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                `;
  
  await sql.end();
  console.log('Manual schema created successfully');
};

export const getTestDatabase = () => {
  if (!testDb) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }
  return testDb;
};

export const cleanupTestData = async () => {
  if (!testDb) {
    console.warn('Test database not initialized, skipping cleanup');
    return;
  }

  try {
    // Clean up test data in reverse order of dependencies
    await testDb.delete(paymentSummaryTable);
    await testDb.delete(paymentsTable);
    await testDb.delete(bookingsTable);
    await testDb.delete(carModel);
    await testDb.delete(carCatalogTable);
    await testDb.delete(parkingTable);
    await testDb.delete(UserTable);
    await testDb.delete(topupTable);
    await testDb.delete(couponTable);
    
    console.log('Test data cleaned up');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};
