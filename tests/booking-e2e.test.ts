import request from 'supertest';
import app from '../src/index';
import { setupTestDatabase, teardownTestDatabase, cleanupTestData, getTestDatabase } from './setup';
import { UserTable, userRoleEnum } from '../src/modules/user/usermodel';
import { parkingTable } from '../src/modules/parking/parkingmodel';
import { carModel, carCatalogTable } from '../src/modules/car/carmodel';
import { bookingsTable } from '../src/modules/booking/bookingmodel';
import { eq } from 'drizzle-orm';

describe('Complete Booking Flow E2E Tests', () => {
  let testDb: any;
  let userToken: string;
  let picToken: string;
  let vendorToken: string;
  let adminToken: string;
  let userId: number;
  let picId: number;
  let vendorId: number;
  let adminId: number;
  let parkingId: number;
  let carId: number;
  let bookingId: number;

  beforeAll(async () => {
    await setupTestDatabase();
    testDb = getTestDatabase();
    
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

    // Create car catalog entry
    const testCarCatalog = await testDb.insert(carCatalogTable).values({
      carName: 'Toyota Camry',
      carMaker: 'Toyota',
      carModelYear: 2023,
      carVendorPrice: '800.00',
      carPlatformPrice: '1000.00',
      category: 'sedan',
      fuelType: 'petrol',
      transmission: 'automatic',
      seats: 5,
      engineCapacity: '2.0L',
      mileage: '15 kmpl',
      features: 'AC,Power Steering,Music System',
      imageUrl: 'catalog1.jpg',
    }).returning();
    const catalogId = testCarCatalog[0].id;

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
      vendorid: 0, // Will be updated after vendor creation
      parkingid: parkingId,
      catalog_id: catalogId,
      status: 'available',
    }).returning();
    carId = testCar[0].id;

    // Create and login regular user
    const userResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        number: '9876543210',
        otp: '123456'
      })
      .expect(200);
    
    userToken = userResponse.body.data.accessToken;
    userId = userResponse.body.data.user.id;

    // Create and login admin user
    const adminResponse = await request(app)
      .post('/api/v1/auth/registerAdmin')
      .send({
        number: '9876543211',
        password: 'admin123',
        role: 'admin',
        name: 'Test Admin',
        email: 'admin@test.com'
      })
      .expect(200);
    
    adminToken = adminResponse.body.data.accessToken;
    adminId = adminResponse.body.data.user.id;

    // Create and login PIC user
    const picResponse = await request(app)
      .post('/api/v1/auth/registerAdmin')
      .send({
        number: '9876543212',
        password: 'pic123',
        role: 'parkingincharge',
        name: 'Test PIC',
        email: 'pic@test.com',
        parkingid: parkingId
      })
      .expect(200);
    
    picToken = picResponse.body.data.accessToken;
    picId = picResponse.body.data.user.id;

    // Create and login vendor user
    const vendorResponse = await request(app)
      .post('/api/v1/auth/registerAdmin')
      .send({
        number: '9876543213',
        password: 'vendor123',
        role: 'vendor',
        name: 'Test Vendor',
        email: 'vendor@test.com'
      })
      .expect(200);
    
    vendorToken = vendorResponse.body.data.accessToken;
    vendorId = vendorResponse.body.data.user.id;

    // Update car with vendor ID
    await testDb.update(carModel)
      .set({ vendorid: vendorId })
      .where(eq(carModel.id, carId));

    // Verify user by admin
    await request(app)
      .put(`/api/v1/user/updateuser/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        isverified: true
      })
      .expect(200);

  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  }, 30000);

  describe('User Registration and Authentication', () => {
    it('should have created regular user', () => {
      expect(userToken).toBeDefined();
      expect(userId).toBeDefined();
    });

    it('should have created admin user', () => {
      expect(adminToken).toBeDefined();
      expect(adminId).toBeDefined();
    });

    it('should have created PIC user', () => {
      expect(picToken).toBeDefined();
      expect(picId).toBeDefined();
    });

    it('should have created vendor user', () => {
      expect(vendorToken).toBeDefined();
      expect(vendorId).toBeDefined();
    });
  });

  describe('User Verification by Admin', () => {
    it('should allow admin to verify user', async () => {
      const response = await request(app)
        .put(`/api/v1/user/updateuser/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          isverified: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isverified).toBe(true);
    });
  });

  describe('Car Search and Filtering', () => {
    it('should get all available cars', async () => {
      const response = await request(app)
        .get('/api/v1/cars/getcar')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].name).toBe('Test Car');
      expect(response.body.data.data[0].isavailable).toBe(true);
    });

    it('should filter cars by status and number', async () => {
      const response = await request(app)
        .get('/api/v1/cars/filter?status=available&number=KL')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data).toHaveLength(1);
      expect(response.body.data.data[0].number).toContain('KL');
    });
  });

  describe('Booking Creation and Management', () => {
    it('should create a booking', async () => {
      const response = await request(app)
        .post('/api/v1/booking')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          carId: carId,
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days later
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.carId).toBe(carId);
      expect(response.body.data.userId).toBe(userId);
      
      bookingId = response.body.data.id;
    });

    it('should get booking status', async () => {
      const response = await request(app)
        .get(`/api/v1/booking/status/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.id).toBe(bookingId);
      expect(response.body.data.booking.status).toBe('pending');
    });
  });

  describe('Advance Payment Flow', () => {
    it('should process advance payment', async () => {
      const response = await request(app)
        .post('/api/v1/booking/advance-payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: bookingId,
          paymentReferenceId: 'PAY_REF_123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.advancePaymentStatus).toBe('paid');
    });

    it('should get OTP after advance payment', async () => {
      const response = await request(app)
        .get(`/api/v1/booking/otp/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.otp).toBeDefined();
      expect(response.body.data.expiresAt).toBeDefined();
    });

    it('should allow resending OTP', async () => {
      const response = await request(app)
        .post('/api/v1/booking/resend-otp')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: bookingId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.otpCode).toBeDefined();
    });
  });

  describe('Booking Rescheduling', () => {
    it('should allow rescheduling booking', async () => {
      const newPickupDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

      const response = await request(app)
        .put(`/api/v1/booking/reschedule/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          newPickupDate: newPickupDate
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pickupDate).toBe(newPickupDate);
    });
  });

  describe('PIC Verification and OTP', () => {
    it('should get PIC by entity', async () => {
      const response = await request(app)
        .get(`/api/v1/booking/pic-by-entity?bookingId=${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pic.id).toBe(picId);
    });

    it('should verify OTP by PIC', async () => {
      // First get the OTP
      const otpResponse = await request(app)
        .get(`/api/v1/booking/otp/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const otp = otpResponse.body.data.otp;

      // Verify OTP with PIC
      const response = await request(app)
        .post('/api/v1/booking/verify-otp')
        .set('Authorization', `Bearer ${picToken}`)
        .send({
          bookingId: bookingId,
          otp: otp
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.otpVerified).toBe(true);
    });
  });

  describe('Car Confirmation Flow', () => {
    it('should submit confirmation request', async () => {
      const response = await request(app)
        .post('/api/v1/booking/submit-confirmation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: bookingId,
          carConditionImages: [
            'https://example.com/car_front.jpg', 
            'https://example.com/car_back.jpg', 
            'https://example.com/car_interior.jpg'
          ],
          tools: [
            { name: 'Spare Tire', imageUrl: 'https://example.com/spare_tire.jpg' },
            { name: 'Jack', imageUrl: 'https://example.com/jack.jpg' },
            { name: 'Tool Kit', imageUrl: 'https://example.com/toolkit.jpg' }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.confirmationStatus).toBe('pending_approval');
    });

    it('should get confirmation requests for PIC', async () => {
      const response = await request(app)
        .get('/api/v1/booking/pic/confirmation-requests')
        .set('Authorization', `Bearer ${picToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.confirmationRequests).toHaveLength(1);
      expect(response.body.data.confirmationRequests[0].id).toBe(bookingId);
    });

    it('should reject confirmation request', async () => {
      const response = await request(app)
        .post('/api/v1/booking/pic-approve')
        .set('Authorization', `Bearer ${picToken}`)
        .send({
          bookingId: bookingId,
          approved: false,
          comments: 'Car condition not satisfactory'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.picApproved).toBe(false);
    });

    it('should get rejected confirmations for user', async () => {
      const response = await request(app)
        .get('/api/v1/booking/user/rejected-confirmations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rejectedConfirmations).toHaveLength(1);
      expect(response.body.data.rejectedConfirmations[0].picApproved).toBe(false);
    });

    it('should resubmit confirmation', async () => {
      const response = await request(app)
        .post('/api/v1/booking/resubmit-confirmation')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: bookingId,
          carConditionImages: [
            'https://example.com/car_front_new.jpg', 
            'https://example.com/car_back_new.jpg', 
            'https://example.com/car_interior_new.jpg'
          ],
          tools: [
            { name: 'Spare Tire', imageUrl: 'https://example.com/spare_tire_new.jpg' },
            { name: 'Jack', imageUrl: 'https://example.com/jack_new.jpg' },
            { name: 'Tool Kit', imageUrl: 'https://example.com/toolkit_new.jpg' }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.confirmationStatus).toBe('pending_approval');
    });

    it('should approve confirmation request', async () => {
      const response = await request(app)
        .post('/api/v1/booking/pic-approve')
        .set('Authorization', `Bearer ${picToken}`)
        .send({
          bookingId: bookingId,
          approved: true,
          comments: 'Car condition is satisfactory'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.picApproved).toBe(true);
    });
  });

  describe('Final Payment and Completion', () => {
    it('should process final payment', async () => {
      const response = await request(app)
        .post('/api/v1/booking/final-payment')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bookingId: bookingId,
          paymentReferenceId: 'FINAL_PAY_REF_123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.finalPaymentStatus).toBe('paid');
    });

    it('should show completed booking status', async () => {
      const response = await request(app)
        .get(`/api/v1/booking/status/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('confirmed');
      expect(response.body.data.booking.advanceAmount).toBe(630);
      expect(response.body.data.booking.remainingAmount).toBe(1470);
    });
  });

  describe('Car Pickup and Return', () => {
    it('should confirm pickup by PIC', async () => {
      const response = await request(app)
        .post('/api/v1/booking/confirm-pickup')
        .set('Authorization', `Bearer ${picToken}`)
        .send({
          bookingId: bookingId
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('active');
    });

    it('should check for overdue status', async () => {
      const response = await request(app)
        .get(`/api/v1/booking/${bookingId}/overdue`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isOverdue).toBeDefined();
    });

    it('should confirm return', async () => {
      const response = await request(app)
        .post('/api/v1/booking/confirm-return')
        .set('Authorization', `Bearer ${picToken}`)
        .send({
          bookingId: bookingId,
          returnCondition: 'good',
          returnImages: ['https://example.com/return_front.jpg', 'https://example.com/return_back.jpg'],
          comments: 'Car returned in good condition'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('completed');
    });
  });

  describe('Topup Management', () => {
    it('should get active topups', async () => {
      const response = await request(app)
        .get('/api/v1/topups/active')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.data)).toBe(true);
    });
  });

  describe('Final Booking Status', () => {
    it('should show final booking status', async () => {
      const response = await request(app)
        .get(`/api/v1/booking/status/${bookingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.booking.status).toBe('completed');
      expect(response.body.data.booking.advanceAmount).toBe(630);
      expect(response.body.data.booking.remainingAmount).toBe(1470);
      expect(response.body.data.booking.totalPrice).toBe(2100);
    });
  });
});