import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import path from 'path';

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
    const sql = postgres(databaseUrl, { max: 1 });
    
    // For testing, we'll create a minimal schema instead of running complex migrations
    // This avoids issues with migration order and dependencies
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        number VARCHAR(20),
        role VARCHAR(50) DEFAULT 'user',
        isverified BOOLEAN DEFAULT false,
        avatar VARCHAR(500),
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
        images JSONB DEFAULT '[]',
        vendorid INTEGER NOT NULL,
        parkingid INTEGER,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql.end();
    console.log('Test database schema created successfully');
  } catch (error) {
    console.error('Failed to create test schema:', error);
    throw error;
  }
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
    await testDb.delete(carModel);
    await testDb.delete(parkingTable);
    await testDb.delete(UserTable);
    
    console.log('Test data cleaned up');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
};
