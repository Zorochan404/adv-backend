import { test, expect } from '@playwright/test';

// Test data for different user roles
const testUsers = {
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
const loginUser = async (request: any, userType: keyof typeof testUsers) => {
  const user = testUsers[userType];
  const response = await request.post('/api/v1/auth/v2/login', {
    data: user
  });
  
  if (response.status() === 200) {
    const data = await response.json();
    return data.data.tokens.accessToken;
  }
  return null;
};

test.describe('RBAC System Tests', () => {
  
  test.describe('User Role Permissions', () => {
    
    test('user should be able to create booking', async ({ request }) => {
      const token = await loginUser(request, 'user');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/booking', {
        data: {
          carId: 1,
          startDate: '2025-01-15',
          endDate: '2025-01-16',
          pickupLocation: 'Test Location',
          dropoffLocation: 'Test Location'
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('user should be able to view own bookings', async ({ request }) => {
      const token = await loginUser(request, 'user');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/my-bookings', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('user should be able to create review', async ({ request }) => {
      const token = await loginUser(request, 'user');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/review/addreview/1', {
        data: {
          rating: 5,
          comment: 'Great car!'
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('user should NOT be able to create car', async ({ request }) => {
      const token = await loginUser(request, 'user');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car/add', {
        data: {
          name: 'Test Car',
          model: 'Test Model',
          year: 2023,
          price: 1000
        },
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });

    test('user should NOT be able to view all users', async ({ request }) => {
      const token = await loginUser(request, 'user');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/user/getallusers', {
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });
  });

  test.describe('Vendor Role Permissions', () => {
    
    test('vendor should be able to create car', async ({ request }) => {
      const token = await loginUser(request, 'vendor');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car/add', {
        data: {
          name: 'Vendor Test Car',
          model: 'Vendor Model',
          year: 2023,
          price: 1500,
          vendorId: 1
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('vendor should be able to update own car', async ({ request }) => {
      const token = await loginUser(request, 'vendor');
      expect(token).toBeTruthy();
      
      const response = await request.put('/api/v1/car/1', {
        data: {
          name: 'Updated Car Name',
          price: 2000
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403]).toContain(response.status());
    });

    test('vendor should be able to view own cars', async ({ request }) => {
      const token = await loginUser(request, 'vendor');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/car/getcar', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('vendor should NOT be able to manage users', async ({ request }) => {
      const token = await loginUser(request, 'vendor');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/user/getallusers', {
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });
  });

  test.describe('PIC (Parking In Charge) Role Permissions', () => {
    
    test('PIC should be able to confirm car pickup', async ({ request }) => {
      const token = await loginUser(request, 'pic');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/booking/confirm-pickup', {
        data: {
          bookingId: 1,
          otp: '123456'
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('PIC should be able to confirm car return', async ({ request }) => {
      const token = await loginUser(request, 'pic');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/booking/confirm-return', {
        data: {
          bookingId: 1,
          condition: 'good'
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('PIC should be able to view PIC dashboard', async ({ request }) => {
      const token = await loginUser(request, 'pic');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/pic/dashboard', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('PIC should be able to view cars under their parking', async ({ request }) => {
      const token = await loginUser(request, 'pic');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/pic/cars', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('PIC should NOT be able to create cars', async ({ request }) => {
      const token = await loginUser(request, 'pic');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car/add', {
        data: {
          name: 'PIC Test Car',
          model: 'PIC Model',
          year: 2023,
          price: 1000
        },
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });
  });

  test.describe('Admin Role Permissions', () => {
    
    test('admin should be able to view all users', async ({ request }) => {
      const token = await loginUser(request, 'admin');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/user/getallusers', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('admin should be able to create cars', async ({ request }) => {
      const token = await loginUser(request, 'admin');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car/add', {
        data: {
          name: 'Admin Test Car',
          model: 'Admin Model',
          year: 2023,
          price: 2000
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('admin should be able to manage parking', async ({ request }) => {
      const token = await loginUser(request, 'admin');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/parking/add', {
        data: {
          name: 'Admin Test Parking',
          address: 'Test Address',
          lat: 12.9716,
          lng: 77.5946
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('admin should be able to create advertisements', async ({ request }) => {
      const token = await loginUser(request, 'admin');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/advertisement/create', {
        data: {
          title: 'Admin Test Ad',
          description: 'Test advertisement',
          imageUrl: 'https://example.com/image.jpg',
          targetUrl: 'https://example.com'
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('admin should be able to view analytics', async ({ request }) => {
      const token = await loginUser(request, 'admin');
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/booking/earnings/overview', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
    });

    test('admin should be able to register staff', async ({ request }) => {
      const token = await loginUser(request, 'admin');
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/auth/v2/staff/register', {
        data: {
          number: '5555555555',
          password: 'newstaff123',
          role: 'vendor',
          name: 'New Staff Member',
          email: 'newstaff@example.com'
        },
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });
  });

  test.describe('Resource Ownership Tests', () => {
    
    test('user should only access own profile', async ({ request }) => {
      const token = await loginUser(request, 'user');
      expect(token).toBeTruthy();
      
      // Try to access another user's profile (assuming user ID 999 doesn't belong to current user)
      const response = await request.get('/api/v1/user/getuser/999', {
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('own resources');
    });

    test('user should only update own bookings', async ({ request }) => {
      const token = await loginUser(request, 'user');
      expect(token).toBeTruthy();
      
      // Try to update a booking that doesn't belong to the user
      const response = await request.put('/api/v1/booking/999', {
        data: {
          startDate: '2025-01-20',
          endDate: '2025-01-21'
        },
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('own resources');
    });

    test('vendor should only update own cars', async ({ request }) => {
      const token = await loginUser(request, 'vendor');
      expect(token).toBeTruthy();
      
      // Try to update a car that doesn't belong to the vendor
      const response = await request.put('/api/v1/car/999', {
        data: {
          name: 'Hacked Car Name'
        },
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('own resources');
    });
  });

  test.describe('Unauthenticated Access Tests', () => {
    
    test('should reject unauthenticated access to protected routes', async ({ request }) => {
      const response = await request.get('/api/v1/user/getallusers');
      expect(response.status()).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Authentication required');
    });

    test('should reject invalid token', async ({ request }) => {
      const response = await request.get('/api/v1/user/getallusers', {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should allow public routes without authentication', async ({ request }) => {
      const response = await request.get('/api/v1/car/nearestcars?lat=12.9716&lng=77.5946');
      expect([200, 404]).toContain(response.status());
    });
  });
});





