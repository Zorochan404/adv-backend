import request from 'supertest';
import app from '../src/index';
import { setupTestDatabase, teardownTestDatabase } from './setup';

describe('Health Check Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database with TestContainers
    await setupTestDatabase();
  }, 300000); // 5 minute timeout for container startup

  afterAll(async () => {
    // Cleanup test database
    await teardownTestDatabase();
  }, 30000); // 30 second timeout for container cleanup

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Server is healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String)
      });
    });
  });
});
