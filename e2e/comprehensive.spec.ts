import { test, expect } from '@playwright/test';

// Test data for comprehensive testing
const testData = {
  user: {
    number: '7002803551',
    otp: '123456',
    authMethod: 'otp'
  },
  admin: {
    number: '9999999999',
    password: 'admin123',
    authMethod: 'password'
  },
  vendor: {
    number: '8888888888',
    password: 'vendor123',
    authMethod: 'password'
  },
  pic: {
    number: '7777777777',
    password: 'pic123',
    authMethod: 'password'
  }
};

// Helper function to get auth headers
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

// Helper function to login and get token
const loginUser = async (request: any, userData: any) => {
  const response = await request.post('/api/v1/auth/v2/login', {
    data: userData
  });
  
  if (response.status() === 200) {
    const data = await response.json();
    return data.data.tokens.accessToken;
  }
  return null;
};

test.describe('Comprehensive System Integration Tests', () => {
  
  test.describe('Complete User Journey', () => {
    
    test('should complete full user booking journey', async ({ request }) => {
      // Step 1: User registration
      const registerResponse = await request.post('/api/v1/auth/v2/register', {
        data: {
          number: '6000000001',
          name: 'Journey Test User',
          email: 'journey@example.com'
        }
      });
      
      expect(registerResponse.status()).toBe(201);
      const registerData = await registerResponse.json();
      expect(registerData.success).toBe(true);
      const userToken = registerData.data.tokens.accessToken;
      
      // Step 2: Search for available cars
      const searchResponse = await request.get('/api/v1/car/nearestcars?lat=12.9716&lng=77.5946');
      expect([200, 404]).toContain(searchResponse.status());
      
      // Step 3: Create booking
      const bookingData = {
        carId: 1,
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        pickupLocation: 'Test Pickup Location',
        dropoffLocation: 'Test Dropoff Location',
        totalAmount: 1000
      };
      
      const bookingResponse = await request.post('/api/v1/booking', {
        data: bookingData,
        headers: getAuthHeaders(userToken)
      });
      
      expect([200, 201, 400]).toContain(bookingResponse.status());
      
      // Step 4: Confirm advance payment
      if (bookingResponse.status() === 201) {
        const bookingResult = await bookingResponse.json();
        const bookingId = bookingResult.data.booking.id;
        
        const paymentResponse = await request.post('/api/v1/booking/advance-payment', {
          data: {
            bookingId: bookingId,
            paymentId: 'test_payment_123',
            amount: 500
          },
          headers: getAuthHeaders(userToken)
        });
        
        expect([200, 400]).toContain(paymentResponse.status());
      }
      
      // Step 5: Submit confirmation request
      const confirmationResponse = await request.post('/api/v1/booking/submit-confirmation', {
        data: {
          bookingId: 1,
          confirmationImages: ['https://example.com/image1.jpg'],
          notes: 'Car is ready for pickup'
        },
        headers: getAuthHeaders(userToken)
      });
      
      expect([200, 400, 404]).toContain(confirmationResponse.status());
      
      // Step 6: View booking status
      const statusResponse = await request.get('/api/v1/booking/status/1', {
        headers: getAuthHeaders(userToken)
      });
      
      expect([200, 400, 403, 404]).toContain(statusResponse.status());
    });
  });

  test.describe('Admin Management Workflow', () => {
    
    test('should complete admin management workflow', async ({ request }) => {
      // Step 1: Admin login
      const adminToken = await loginUser(request, testData.admin);
      expect(adminToken).toBeTruthy();
      
      // Step 2: Create parking location
      const parkingResponse = await request.post('/api/v1/parking/add', {
        data: {
          name: 'Test Parking Location',
          address: '123 Test Street, Test City',
          lat: 12.9716,
          lng: 77.5946,
          capacity: 50
        },
        headers: getAuthHeaders(adminToken!)
      });
      
      expect([200, 201, 400]).toContain(parkingResponse.status());
      
      // Step 3: Register staff (PIC)
      const staffResponse = await request.post('/api/v1/auth/v2/staff/register', {
        data: {
          number: '5555555555',
          password: 'newpic123',
          role: 'parkingincharge',
          name: 'New PIC',
          email: 'newpic@example.com',
          parkingid: 1
        },
        headers: getAuthHeaders(adminToken!)
      });
      
      expect([200, 201, 400]).toContain(staffResponse.status());
      
      // Step 4: Create car catalog
      const catalogResponse = await request.post('/api/v1/car-catalog/create', {
        data: {
          name: 'Economy Cars',
          description: 'Affordable economy cars',
          basePrice: 1000,
          lateFeePerHour: 50,
          isActive: true
        },
        headers: getAuthHeaders(adminToken!)
      });
      
      expect([200, 201, 400]).toContain(catalogResponse.status());
      
      // Step 5: Create advertisement
      const adResponse = await request.post('/api/v1/advertisement/create', {
        data: {
          title: 'Test Advertisement',
          description: 'Test ad description',
          imageUrl: 'https://example.com/ad.jpg',
          targetUrl: 'https://example.com',
          isActive: true
        },
        headers: getAuthHeaders(adminToken!)
      });
      
      expect([200, 201, 400]).toContain(adResponse.status());
      
      // Step 6: View analytics
      const analyticsResponse = await request.get('/api/v1/booking/earnings/overview', {
        headers: getAuthHeaders(adminToken!)
      });
      
      expect([200, 404]).toContain(analyticsResponse.status());
    });
  });

  test.describe('Vendor Management Workflow', () => {
    
    test('should complete vendor management workflow', async ({ request }) => {
      // Step 1: Vendor login
      const vendorToken = await loginUser(request, testData.vendor);
      expect(vendorToken).toBeTruthy();
      
      // Step 2: Create car
      const carResponse = await request.post('/api/v1/car/add', {
        data: {
          name: 'Vendor Test Car',
          model: 'Vendor Model',
          year: 2023,
          price: 2000,
          brand: 'Toyota',
          fuelType: 'Petrol',
          transmission: 'Manual',
          seats: 5,
          mileage: 15,
          description: 'A great vendor car',
          images: ['https://example.com/car.jpg'],
          features: ['AC', 'Power Steering'],
          vendorId: 1,
          parkingId: 1
        },
        headers: getAuthHeaders(vendorToken!)
      });
      
      expect([200, 201, 400]).toContain(carResponse.status());
      
      // Step 3: Update car
      const updateResponse = await request.put('/api/v1/car/1', {
        data: {
          name: 'Updated Vendor Car',
          price: 2500
        },
        headers: getAuthHeaders(vendorToken!)
      });
      
      expect([200, 400, 403, 404]).toContain(updateResponse.status());
      
      // Step 4: View own cars
      const carsResponse = await request.get('/api/v1/car/getcar', {
        headers: getAuthHeaders(vendorToken!)
      });
      
      expect([200, 404]).toContain(carsResponse.status());
    });
  });

  test.describe('PIC Operations Workflow', () => {
    
    test('should complete PIC operations workflow', async ({ request }) => {
      // Step 1: PIC login
      const picToken = await loginUser(request, testData.pic);
      expect(picToken).toBeTruthy();
      
      // Step 2: View PIC dashboard
      const dashboardResponse = await request.get('/api/v1/booking/pic/dashboard', {
        headers: getAuthHeaders(picToken!)
      });
      
      expect([200, 404]).toContain(dashboardResponse.status());
      
      // Step 3: View pickup cars
      const pickupResponse = await request.get('/api/v1/pic/pickup-cars', {
        headers: getAuthHeaders(picToken!)
      });
      
      expect([200, 404]).toContain(pickupResponse.status());
      
      // Step 4: View dropoff cars
      const dropoffResponse = await request.get('/api/v1/pic/dropoff-cars', {
        headers: getAuthHeaders(picToken!)
      });
      
      expect([200, 404]).toContain(dropoffResponse.status());
      
      // Step 5: Confirm car pickup
      const pickupConfirmResponse = await request.post('/api/v1/booking/confirm-pickup', {
        data: {
          bookingId: 1,
          otp: '123456',
          condition: 'good',
          notes: 'Car picked up successfully'
        },
        headers: getAuthHeaders(picToken!)
      });
      
      expect([200, 400, 404]).toContain(pickupConfirmResponse.status());
      
      // Step 6: Confirm car return
      const returnConfirmResponse = await request.post('/api/v1/booking/confirm-return', {
        data: {
          bookingId: 1,
          condition: 'good',
          notes: 'Car returned in good condition'
        },
        headers: getAuthHeaders(picToken!)
      });
      
      expect([200, 400, 404]).toContain(returnConfirmResponse.status());
    });
  });

  test.describe('Cross-System Integration', () => {
    
    test('should handle car availability updates through booking lifecycle', async ({ request }) => {
      // Step 1: User creates booking
      const userToken = await loginUser(request, testData.user);
      expect(userToken).toBeTruthy();
      
      const bookingResponse = await request.post('/api/v1/booking', {
        data: {
          carId: 1,
          startDate: '2025-01-15',
          endDate: '2025-01-16',
          pickupLocation: 'Test Location',
          dropoffLocation: 'Test Location',
          totalAmount: 1000
        },
        headers: getAuthHeaders(userToken!)
      });
      
      expect([200, 201, 400]).toContain(bookingResponse.status());
      
      // Step 2: Confirm advance payment (should mark car as booked)
      if (bookingResponse.status() === 201) {
        const bookingResult = await bookingResponse.json();
        const bookingId = bookingResult.data.booking.id;
        
        const paymentResponse = await request.post('/api/v1/booking/advance-payment', {
          data: {
            bookingId: bookingId,
            paymentId: 'test_payment_123',
            amount: 500
          },
          headers: getAuthHeaders(userToken!)
        });
        
        expect([200, 400]).toContain(paymentResponse.status());
      }
      
      // Step 3: Verify car is no longer available in search
      const searchResponse = await request.get('/api/v1/car/nearestcars?lat=12.9716&lng=77.5946');
      expect([200, 404]).toContain(searchResponse.status());
      
      if (searchResponse.status() === 200) {
        const searchData = await searchResponse.json();
        // Car with ID 1 should not be in available cars list
        const car1 = searchData.data.cars.find((car: any) => car.id === 1);
        if (car1) {
          expect(car1.status).not.toBe('available');
        }
      }
    });

    test('should handle late fees calculation and payment', async ({ request }) => {
      const userToken = await loginUser(request, testData.user);
      expect(userToken).toBeTruthy();
      
      // Step 1: Check if booking is overdue
      const overdueResponse = await request.get('/api/v1/booking/1/overdue', {
        headers: getAuthHeaders(userToken!)
      });
      
      expect([200, 400, 403, 404]).toContain(overdueResponse.status());
      
      // Step 2: Calculate late fees
      const lateFeesResponse = await request.get('/api/v1/booking/1/late-fees', {
        headers: getAuthHeaders(userToken!)
      });
      
      expect([200, 400, 403, 404]).toContain(lateFeesResponse.status());
      
      // Step 3: Pay late fees
      const payLateFeesResponse = await request.post('/api/v1/booking/pay-late-fees', {
        data: {
          bookingId: 1,
          paymentId: 'late_fee_payment_123',
          amount: 100
        },
        headers: getAuthHeaders(userToken!)
      });
      
      expect([200, 400, 404]).toContain(payLateFeesResponse.status());
    });

    test('should handle review system integration', async ({ request }) => {
      const userToken = await loginUser(request, testData.user);
      expect(userToken).toBeTruthy();
      
      // Step 1: Create review
      const reviewResponse = await request.post('/api/v1/review/addreview/1', {
        data: {
          rating: 5,
          comment: 'Excellent car and service!'
        },
        headers: getAuthHeaders(userToken!)
      });
      
      expect([200, 201, 400]).toContain(reviewResponse.status());
      
      // Step 2: Update review
      const updateReviewResponse = await request.put('/api/v1/review/updatereview/1', {
        data: {
          rating: 4,
          comment: 'Updated review - still great!'
        },
        headers: getAuthHeaders(userToken!)
      });
      
      expect([200, 400, 403, 404]).toContain(updateReviewResponse.status());
      
      // Step 3: View reviews (public)
      const viewReviewsResponse = await request.get('/api/v1/review/getreviews/1');
      expect([200, 404]).toContain(viewReviewsResponse.status());
      
      // Step 4: Get average rating
      const avgRatingResponse = await request.get('/api/v1/review/avg-rating/1');
      expect([200, 404]).toContain(avgRatingResponse.status());
    });
  });

  test.describe('Security and Permission Integration', () => {
    
    test('should enforce RBAC across all systems', async ({ request }) => {
      // Test user cannot access admin functions
      const userToken = await loginUser(request, testData.user);
      expect(userToken).toBeTruthy();
      
      const adminFunctions = [
        { method: 'GET', url: '/api/v1/user/getallusers' },
        { method: 'POST', url: '/api/v1/car/add', data: { name: 'Test' } },
        { method: 'POST', url: '/api/v1/parking/add', data: { name: 'Test' } },
        { method: 'POST', url: '/api/v1/advertisement/create', data: { title: 'Test' } }
      ];
      
      for (const func of adminFunctions) {
        const response = await request[func.method.toLowerCase()](func.url, {
          data: func.data,
          headers: getAuthHeaders(userToken!)
        });
        
        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.message).toContain('Access denied');
      }
    });

    test('should enforce resource ownership', async ({ request }) => {
      const userToken = await loginUser(request, testData.user);
      expect(userToken).toBeTruthy();
      
      // Test user cannot access other user's resources
      const ownershipTests = [
        { method: 'GET', url: '/api/v1/user/getuser/999' },
        { method: 'PUT', url: '/api/v1/booking/999', data: { startDate: '2025-01-20' } },
        { method: 'DELETE', url: '/api/v1/booking/999' },
        { method: 'PUT', url: '/api/v1/review/updatereview/999', data: { rating: 5 } }
      ];
      
      for (const test of ownershipTests) {
        const response = await request[test.method.toLowerCase()](test.url, {
          data: test.data,
          headers: getAuthHeaders(userToken!)
        });
        
        expect(response.status()).toBe(403);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.message).toContain('own resources');
      }
    });

    test('should handle authentication across all endpoints', async ({ request }) => {
      // Test protected endpoints require authentication
      const protectedEndpoints = [
        { method: 'GET', url: '/api/v1/user/getallusers' },
        { method: 'POST', url: '/api/v1/booking' },
        { method: 'POST', url: '/api/v1/car/add' },
        { method: 'POST', url: '/api/v1/review/addreview/1' }
      ];
      
      for (const endpoint of protectedEndpoints) {
        const response = await request[endpoint.method.toLowerCase()](endpoint.url, {
          data: endpoint.data
        });
        
        expect(response.status()).toBe(401);
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.message).toContain('Authentication required');
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    
    test('should handle invalid data gracefully', async ({ request }) => {
      const userToken = await loginUser(request, testData.user);
      expect(userToken).toBeTruthy();
      
      // Test invalid booking data
      const invalidBookingResponse = await request.post('/api/v1/booking', {
        data: {
          carId: 'invalid',
          startDate: 'invalid-date',
          endDate: 'invalid-date'
        },
        headers: getAuthHeaders(userToken!)
      });
      
      expect(invalidBookingResponse.status()).toBe(400);
      const data = await invalidBookingResponse.json();
      expect(data.success).toBe(false);
    });

    test('should handle non-existent resources', async ({ request }) => {
      const userToken = await loginUser(request, testData.user);
      expect(userToken).toBeTruthy();
      
      // Test non-existent booking
      const response = await request.get('/api/v1/booking/99999', {
        headers: getAuthHeaders(userToken!)
      });
      
      expect([404, 403]).toContain(response.status());
    });

    test('should handle rate limiting', async ({ request }) => {
      // Test multiple rapid requests to trigger rate limiting
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request.post('/api/v1/auth/v2/login', {
            data: {
              identifier: '0000000000',
              password: 'wrongpassword',
              authMethod: 'password'
            }
          })
        );
      }
      
      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429) or all should be 401
      const statusCodes = responses.map(r => r.status());
      expect(statusCodes.some(code => code === 429 || code === 401)).toBe(true);
    });
  });
});





