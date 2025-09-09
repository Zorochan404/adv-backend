import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { db } from '../src/drizzle/db';

let testDb: ReturnType<typeof drizzle>;
let testSql: ReturnType<typeof postgres>;

export const getTestDatabase = () => {
  if (!testDb && process.env.DATABASE_URL) {
    testSql = postgres(process.env.DATABASE_URL, { max: 1 });
    testDb = drizzle(testSql);
  }
  return testDb;
};

export const closeTestDatabase = async () => {
  if (testSql) {
    await testSql.end();
    testSql = null as any;
    testDb = null as any;
  }
};

// Helper function to create test data
export const createTestUser = async (userData: any = {}) => {
  const db = getTestDatabase();
  const defaultUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'hashedpassword',
    role: 'user',
    ...userData
  };
  
  // This would need to be adapted based on your actual user model
  // For now, we'll return a mock user object
  return {
    id: Math.floor(Math.random() * 1000),
    ...defaultUser,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Helper function to create test car
export const createTestCar = async (carData: any = {}) => {
  const defaultCar = {
    name: 'Test Car',
    maker: 'Test Maker',
    model: 'Test Model',
    year: 2023,
    pricePerDay: 100,
    category: 'sedan',
    ...carData
  };
  
  return {
    id: Math.floor(Math.random() * 1000),
    ...defaultCar,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};
