import request from 'supertest';
import app from '../src/index';
import { setupTestDatabase, teardownTestDatabase, cleanupTestData, getTestDatabase } from './setup';

describe('Parking API Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database with TestContainers
    await setupTestDatabase();
  }, 300000); // 5 minute timeout for container startup

  beforeEach(async () => {
    // Clean up test data before each test
    await cleanupTestData();
  });

  afterAll(async () => {
    // Cleanup test database
    await teardownTestDatabase();
  }, 30000); // 30 second timeout for container cleanup

  describe('GET /api/v1/parking/get', () => {
    it('should return empty array when no parking exists', async () => {
      const response = await request(app)
        .get('/api/v1/parking/get')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          data: [],
          total: 0
        },
        message: 'Parking fetched successfully',
        statusCode: 200
      });
    });

    it('should return all parking after creating some', async () => {
      const db = getTestDatabase();
      
      // Create test parking data
      const testParking = [
        {
          name: 'Test Parking 1',
          locality: 'Test Locality 1',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          pincode: 123456,
          capacity: 50,
          lat: 12.9716,
          lng: 77.5946,
          mainimg: 'test-image-1.jpg',
          images: ['img1.jpg', 'img2.jpg']
        },
        {
          name: 'Test Parking 2',
          locality: 'Test Locality 2',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          pincode: 123457,
          capacity: 30,
          lat: 12.9717,
          lng: 77.5947,
          mainimg: 'test-image-2.jpg',
          images: ['img3.jpg', 'img4.jpg']
        }
      ];

      // Insert test data directly into database
      const { parkingTable } = await import('../src/modules/parking/parkingmodel');
      await db.insert(parkingTable).values(testParking);

      // Get all parking
      const response = await request(app)
        .get('/api/v1/parking/get')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.data).toHaveLength(2);
      
      // Verify parking data structure
      const parking = response.body.data.data;
      expect(parking[0]).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        locality: expect.any(String),
        city: expect.any(String),
        state: expect.any(String),
        country: expect.any(String),
        pincode: expect.any(Number),
        capacity: expect.any(Number),
        lat: expect.any(Number),
        lng: expect.any(Number),
        mainimg: expect.any(String),
        images: expect.any(Array),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });

  describe('GET /api/v1/parking/getbyid/:id', () => {
    let testParkingId: number;

    beforeEach(async () => {
      const db = getTestDatabase();
      const { parkingTable } = await import('../src/modules/parking/parkingmodel');
      
      // Create a test parking
      const testParking = {
        name: 'Test Parking for ID',
        locality: 'Test Locality',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        pincode: 123456,
        capacity: 50,
        lat: 12.9716,
        lng: 77.5946,
        mainimg: 'test-image.jpg',
        images: ['img1.jpg', 'img2.jpg']
      };

      const result = await db.insert(parkingTable).values(testParking).returning();
      testParkingId = result[0].id;
    });

    it('should return parking by valid ID', async () => {
      const response = await request(app)
        .get(`/api/v1/parking/getbyid/${testParkingId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        parking: expect.objectContaining({
          id: testParkingId,
          name: 'Test Parking for ID',
          locality: 'Test Locality',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          pincode: 123456,
          capacity: 50,
          lat: 12.9716,
          lng: 77.5946
        }),
        cars: expect.any(Array),
        totalCars: expect.any(Number),
        availableCars: expect.any(Number)
      });
    });

    it('should return 400 for invalid parking ID', async () => {
      const response = await request(app)
        .get('/api/v1/parking/getbyid/invalid')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid ID format'),
        statusCode: 400
      });
    });

    it('should return 404 for non-existent parking ID', async () => {
      const response = await request(app)
        .get('/api/v1/parking/getbyid/99999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Parking not found',
        statusCode: 404
      });
    });
  });

  describe('GET /api/v1/parking/search', () => {
    beforeEach(async () => {
      const db = getTestDatabase();
      const { parkingTable } = await import('../src/modules/parking/parkingmodel');
      
      // Create test parking data with different locations
      const testParking = [
        {
          name: 'Mall Parking',
          locality: 'Downtown',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          pincode: 400001,
          capacity: 100,
          lat: 19.0760,
          lng: 72.8777,
          mainimg: 'mall-parking.jpg',
          images: ['mall1.jpg', 'mall2.jpg']
        },
        {
          name: 'Airport Parking',
          locality: 'Airport Area',
          city: 'Delhi',
          state: 'Delhi',
          country: 'India',
          pincode: 110037,
          capacity: 200,
          lat: 28.5562,
          lng: 77.1000,
          mainimg: 'airport-parking.jpg',
          images: ['airport1.jpg', 'airport2.jpg']
        },
        {
          name: 'Station Parking',
          locality: 'Central',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: 560001,
          capacity: 75,
          lat: 12.9716,
          lng: 77.5946,
          mainimg: 'station-parking.jpg',
          images: ['station1.jpg', 'station2.jpg']
        }
      ];

      await db.insert(parkingTable).values(testParking);
    });

    it('should filter parking by city', async () => {
      const response = await request(app)
        .get('/api/v1/parking/search?city=Mumbai')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].city).toBe('Mumbai');
    });

    it('should filter parking by state', async () => {
      const response = await request(app)
        .get('/api/v1/parking/search?state=Karnataka')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].state).toBe('Karnataka');
    });

    it('should filter parking by pincode', async () => {
      const response = await request(app)
        .get('/api/v1/parking/search?pincode=400001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].pincode).toBe(400001);
    });

    it('should filter parking by name (case insensitive)', async () => {
      const response = await request(app)
        .get('/api/v1/parking/search?name=airport')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Airport Parking');
    });

    it('should return empty array when no parking matches filters', async () => {
      const response = await request(app)
        .get('/api/v1/parking/search?city=NonExistentCity')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.message).toBe('No parking found with the specified filters');
    });

    it('should return all parking when no filters provided', async () => {
      const response = await request(app)
        .get('/api/v1/parking/search')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(3);
    });
  });

  describe('POST /api/v1/parking/nearby', () => {
    beforeEach(async () => {
      const db = getTestDatabase();
      const { parkingTable } = await import('../src/modules/parking/parkingmodel');
      
      // Create test parking data around Bangalore (12.9716, 77.5946)
      const testParking = [
        {
          name: 'Nearby Parking 1',
          locality: 'Nearby Locality 1',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: 560001,
          capacity: 50,
          lat: 12.9716, // Same as search point
          lng: 77.5946,
          mainimg: 'nearby1.jpg',
          images: ['nearby1-1.jpg', 'nearby1-2.jpg']
        },
        {
          name: 'Nearby Parking 2',
          locality: 'Nearby Locality 2',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: 560002,
          capacity: 30,
          lat: 12.9720, // ~50m away
          lng: 77.5950,
          mainimg: 'nearby2.jpg',
          images: ['nearby2-1.jpg', 'nearby2-2.jpg']
        },
        {
          name: 'Far Parking',
          locality: 'Far Locality',
          city: 'Bangalore',
          state: 'Karnataka',
          country: 'India',
          pincode: 560100,
          capacity: 100,
          lat: 20.0000, // ~800km away - outside default 500km radius
          lng: 80.0000,
          mainimg: 'far.jpg',
          images: ['far1.jpg', 'far2.jpg']
        }
      ];

      await db.insert(parkingTable).values(testParking);
    });

    it('should return nearby parking within default radius', async () => {
      const response = await request(app)
        .post('/api/v1/parking/nearby')
        .send({
          lat: 12.9716,
          lng: 77.5946
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(2); // Should find 2 nearby parking
      expect(response.body.data.data[0]).toHaveProperty('distance');
      expect(response.body.data.data[1]).toHaveProperty('distance');
      
      // Verify distance is calculated
      expect(response.body.data.data[0].distance).toBeLessThanOrEqual(500); // Default radius
    });

    it('should return nearby parking within custom radius', async () => {
      const response = await request(app)
        .post('/api/v1/parking/nearby')
        .send({
          lat: 12.9716,
          lng: 77.5946,
          radius: 0.05 // 0.05km = 50m radius
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1); // Should find 1 very close parking
    });

    it('should return 400 when coordinates are missing', async () => {
      const response = await request(app)
        .post('/api/v1/parking/nearby')
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid input'),
        statusCode: 400
      });
    });

    it('should return 400 for invalid coordinates', async () => {
      const response = await request(app)
        .post('/api/v1/parking/nearby')
        .send({
          lat: 200, // Invalid latitude
          lng: 77.5946
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid latitude'),
        statusCode: 400
      });
    });

    it('should return empty array when no parking found nearby', async () => {
      const response = await request(app)
        .post('/api/v1/parking/nearby')
        .send({
          lat: 1.0, // Far from any test data (Bangalore is at 12.9716, 77.5946)
          lng: 1.0,
          radius: 0.1 // 0.1km radius
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(0);
      expect(response.body.message).toBe('No parking found');
    });
  });

  describe('Health Check', () => {
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
