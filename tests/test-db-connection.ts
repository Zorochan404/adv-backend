import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create a test-specific database connection
let testDb: ReturnType<typeof drizzle>;
let testSql: ReturnType<typeof postgres>;

export const getTestDbConnection = () => {
  if (!testDb && process.env.DATABASE_URL) {
    testSql = postgres(process.env.DATABASE_URL, { max: 1 });
    testDb = drizzle(testSql);
  }
  return testDb;
};

export const closeTestDbConnection = async () => {
  if (testSql) {
    await testSql.end();
    testSql = null as any;
    testDb = null as any;
  }
};

// Mock the database connection for tests
export const mockDbConnection = () => {
  const originalDb = require('../src/drizzle/db').db;
  
  // Replace the db export with our test database
  const testDb = getTestDbConnection();
  
  // This is a simple approach - in a real scenario you might want to use dependency injection
  return testDb;
};
