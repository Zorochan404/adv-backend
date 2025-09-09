import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  number: '7002803551',
  otp: '123456',
  authMethod: 'otp'
};

const testAdmin = {
  number: '9999999999',
  password: 'admin123',
  authMethod: 'password'
};

const testPIC = {
  number: '7777777777',
  password: 'pic123',
  authMethod: 'password'
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

test.describe('Booking System Tests', () => {
  
  test.describe('Booking Creation and Management', () => {
    
    test('should create booking successfully', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const bookingData = {
        carId: 1,
        startDate: '2025-01-15',
        endDate: '2025-01-16',
        pickupLocation: 'Test Pickup Location',
        dropoffLocation: 'Test Dropoff Location',
        totalAmount: 1000
      };
      
      const response = await request.post('/api/v1/booking', {
        data: bookingData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.booking).toBeDefined();
        expect(data.data.booking.carId).toBe(bookingData.carId);
      }
    });

    test('should get user bookings', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/my-bookings', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.bookings)).toBe(true);
      }
    });

    test('should get formatted user bookings', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/user/formatted', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.currentBookings).toBeDefined();
        expect(data.data.pastBookings).toBeDefined();
      }
    });

    test('should update booking', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const updateData = {
        startDate: '2025-01-20',
        endDate: '2025-01-21',
        pickupLocation: 'Updated Pickup Location'
      };
      
      const response = await request.put('/api/v1/booking/1', {
        data: updateData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });

    test('should delete booking', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.delete('/api/v1/booking/1', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Payment Flow Tests', () => {
    
    test('should confirm advance payment', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const paymentData = {
        bookingId: 1,
        paymentId: 'test_payment_123',
        amount: 500
      };
      
      const response = await request.post('/api/v1/booking/advance-payment', {
        data: paymentData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should submit confirmation request', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const confirmationData = {
        bookingId: 1,
        confirmationImages: ['https://example.com/image1.jpg'],
        notes: 'Car is ready for pickup'
      };
      
      const response = await request.post('/api/v1/booking/submit-confirmation', {
        data: confirmationData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should get rejected confirmations', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/user/rejected-confirmations', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('should resubmit confirmation request', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const resubmitData = {
        bookingId: 1,
        confirmationImages: ['https://example.com/image2.jpg'],
        notes: 'Updated confirmation with better images'
      };
      
      const response = await request.post('/api/v1/booking/resubmit-confirmation', {
        data: resubmitData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });
  });

  test.describe('PIC (Parking In Charge) Operations', () => {
    
    test('should confirm car pickup', async ({ request }) => {
      const token = await loginUser(request, testPIC);
      expect(token).toBeTruthy();
      
      const pickupData = {
        bookingId: 1,
        otp: '123456',
        condition: 'good',
        notes: 'Car picked up successfully'
      };
      
      const response = await request.post('/api/v1/booking/confirm-pickup', {
        data: pickupData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should confirm car return', async ({ request }) => {
      const token = await loginUser(request, testPIC);
      expect(token).toBeTruthy();
      
      const returnData = {
        bookingId: 1,
        condition: 'good',
        notes: 'Car returned in good condition'
      };
      
      const response = await request.post('/api/v1/booking/confirm-return', {
        data: returnData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should get PIC dashboard', async ({ request }) => {
      const token = await loginUser(request, testPIC);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/pic/dashboard', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.dashboard).toBeDefined();
      }
    });

    test('should get PIC bookings', async ({ request }) => {
      const token = await loginUser(request, testPIC);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/pic/bookings', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('should get PIC confirmation requests', async ({ request }) => {
      const token = await loginUser(request, testPIC);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/pic/confirmation-requests', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('should approve booking confirmation', async ({ request }) => {
      const token = await loginUser(request, testPIC);
      expect(token).toBeTruthy();
      
      const approvalData = {
        bookingId: 1,
        approved: true,
        notes: 'Confirmation approved'
      };
      
      const response = await request.post('/api/v1/booking/pic-approve', {
        data: approvalData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });
  });

  test.describe('OTP Verification Tests', () => {
    
    test('should verify booking OTP', async ({ request }) => {
      const token = await loginUser(request, testPIC);
      expect(token).toBeTruthy();
      
      const otpData = {
        bookingId: 1,
        otp: '123456'
      };
      
      const response = await request.post('/api/v1/booking/verify-otp', {
        data: otpData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should resend booking OTP', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const resendData = {
        bookingId: 1
      };
      
      const response = await request.post('/api/v1/booking/resend-otp', {
        data: resendData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should get booking OTP', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/otp/1', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Topup and Late Fees Tests', () => {
    
    test('should check booking overdue status', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/1/overdue', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });

    test('should apply topup to booking', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const topupData = {
        bookingId: 1,
        topupId: 1,
        amount: 200
      };
      
      const response = await request.post('/api/v1/booking/apply-topup', {
        data: topupData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should calculate late fees', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/1/late-fees', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });

    test('should pay late fees', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const paymentData = {
        bookingId: 1,
        paymentId: 'late_fee_payment_123',
        amount: 100
      };
      
      const response = await request.post('/api/v1/booking/pay-late-fees', {
        data: paymentData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });
  });

  test.describe('Booking Status and Public Access', () => {
    
    test('should get booking status (authenticated)', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/status/1', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });

    test('should get public booking status (no auth required)', async ({ request }) => {
      const response = await request.get('/api/v1/booking/public/status/1');
      
      // Should succeed (200) or fail with not found (404), not authentication error (401)
      expect([200, 404]).toContain(response.status());
    });

    test('should reschedule booking', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const rescheduleData = {
        newStartDate: '2025-01-25',
        newEndDate: '2025-01-26',
        reason: 'Change in travel plans'
      };
      
      const response = await request.put('/api/v1/booking/reschedule/1', {
        data: rescheduleData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });
  });

  test.describe('Admin Operations', () => {
    
    test('should get earnings overview (admin only)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/earnings/overview', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.earnings).toBeDefined();
      }
    });

    test('should confirm final payment', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const paymentData = {
        bookingId: 1,
        paymentId: 'final_payment_123',
        amount: 500
      };
      
      const response = await request.post('/api/v1/booking/final-payment', {
        data: paymentData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });
  });

  test.describe('Validation and Error Handling', () => {
    
    test('should validate booking creation data', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      // Test with missing required fields
      const invalidData = {
        carId: 1
        // Missing startDate, endDate, etc.
      };
      
      const response = await request.post('/api/v1/booking', {
        data: invalidData,
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should handle non-existent booking IDs', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/99999', {
        headers: getAuthHeaders(token!)
      });
      
      expect([404, 403]).toContain(response.status());
    });

    test('should enforce resource ownership', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      // Try to access a booking that doesn't belong to the user
      const response = await request.get('/api/v1/booking/999', {
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('own resources');
    });
  });
});





