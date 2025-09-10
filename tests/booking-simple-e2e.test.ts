import request from 'supertest';
import app from '../src/index';
import { setupTestDatabase, teardownTestDatabase, cleanupTestData, getTestDatabase } from './setup';
import { UserTable } from '../src/modules/user/usermodel';
import { parkingTable } from '../src/modules/parking/parkingmodel';
import { carModel } from '../src/modules/car/carmodel';
import { eq } from 'drizzle-orm';

describe('Simple Booking Flow E2E Tests', () => {
  let testDb: any;
  let userToken: string;
  let userId: number;
  let parkingId: number;
  let carId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    testDb = getTestDatabase();
  }, 30000);

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test parking
    const testParking = await testDb.insert(parkingTable).values({
      name: 'Test Parking',
      locality: 'Test Locality',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      pincode: 560001,
      capacity: 100,
      mainimg: 'test-main.jpg',
      images: ['test1.jpg', 'test2.jpg'],
      lat: 12.9716,
      lng: 77.5946,
    }).returning();
    parkingId = testParking[0].id;

    // Create test car
    const testCar = await testDb.insert(carModel).values({
      name: 'Test Car',
      number: 'KL01AB1234',
      price: 1000,
      discountprice: 800,
      color: 'Red',
      rcnumber: 'RC123456',
      rcimg: 'rc.jpg',
      pollutionimg: 'pollution.jpg',
      insuranceimg: 'insurance.jpg',
      inmaintainance: false,
      isavailable: true,
      images: ['car1.jpg', 'car2.jpg'],
      vendorid: 1, // Use a simple vendor ID
      parkingid: parkingId,
      status: 'available',
    }).returning();
    carId = testCar[0].id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  }, 30000);

  describe('Basic Functionality Tests', () => {
    it('should register and login a user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          number: '9876543210',
          otp: '123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('user');
      expect(response.body.data.accessToken).toBeDefined();
      
      userToken = response.body.data.accessToken;
      userId = response.body.data.user.id;
    });

  it('should get all available cars', async () => {
    // First login to get fresh token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        number: '9876543210',
        otp: '123456'
      })
      .expect(200);

    const token = loginResponse.body.data.accessToken;

    const response = await request(app)
      .get('/api/v1/cars/getcar')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.data).toHaveLength(1);
    expect(response.body.data.data[0].name).toBe('Test Car');
  });

    it('should filter cars by status and number', async () => {
      const response = await request(app)
        .get('/api/v1/cars/filter?status=available&number=KL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].number).toBe('KL01AB1234');
    });

    it('should get parking locations', async () => {
      const response = await request(app)
        .get('/api/v1/parking/get')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Test Parking');
    });

    it('should get active topups', async () => {
      const response = await request(app)
        .get('/api/v1/topups/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });

    it('should create a booking with authenticated user', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          number: '9876543210',
          otp: '123456'
        })
        .expect(200);

      const token = loginResponse.body.data.accessToken;
      const userId = loginResponse.body.data.user.id;

      // Verify the user (simulate admin verification)
      await testDb.update(UserTable)
        .set({ isverified: true })
        .where(eq(UserTable.id, userId));

      // Create booking
      const response = await request(app)
        .post('/api/v1/booking')
        .set('Authorization', `Bearer ${token}`)
        .send({
          carId: carId,
          startDate: '2024-01-15T10:00:00Z',
          endDate: '2024-01-16T18:00:00Z',
          pickupDate: '2024-01-15T10:00:00Z',
          returnTime: '18:00'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.carId).toBe(carId);
    });
  });
});
