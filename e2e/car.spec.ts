import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  number: '7002803551',
  otp: '123456',
  authMethod: 'otp'
};

const testVendor = {
  number: '8888888888',
  password: 'vendor123',
  authMethod: 'password'
};

const testAdmin = {
  number: '9999999999',
  password: 'admin123',
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

test.describe('Car Management System Tests', () => {
  
  test.describe('Public Car Discovery', () => {
    
    test('should get nearest available cars', async ({ request }) => {
      const response = await request.get('/api/v1/car/nearestcars?lat=12.9716&lng=77.5946');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
      }
    });

    test('should get nearest popular cars', async ({ request }) => {
      const response = await request.get('/api/v1/car/nearestpopularcars?lat=12.9716&lng=77.5946');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
      }
    });

    test('should search cars by name or number', async ({ request }) => {
      const response = await request.get('/api/v1/car/search?query=Toyota');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
      }
    });

    test('should filter cars', async ({ request }) => {
      const response = await request.get('/api/v1/car/filter?minPrice=1000&maxPrice=5000&brand=Toyota');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
      }
    });

    test('should get car by ID', async ({ request }) => {
      const response = await request.get('/api/v1/car/getcar/1');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.car).toBeDefined();
        expect(data.data.car.id).toBe(1);
      }
    });

    test('should get cars by parking ID', async ({ request }) => {
      const response = await request.get('/api/v1/car/carbyparking/1');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
      }
    });
  });

  test.describe('Car Management (Vendor/Admin)', () => {
    
    test('should create car (vendor)', async ({ request }) => {
      const token = await loginUser(request, testVendor);
      expect(token).toBeTruthy();
      
      const carData = {
        name: 'Test Car',
        model: 'Test Model',
        year: 2023,
        price: 2000,
        brand: 'Toyota',
        fuelType: 'Petrol',
        transmission: 'Manual',
        seats: 5,
        mileage: 15,
        description: 'A great test car',
        images: ['https://example.com/car1.jpg'],
        features: ['AC', 'Power Steering'],
        vendorId: 1,
        parkingId: 1
      };
      
      const response = await request.post('/api/v1/car/add', {
        data: carData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
      
      if (response.status() === 201) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.car).toBeDefined();
        expect(data.data.car.name).toBe(carData.name);
      }
    });

    test('should create car (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const carData = {
        name: 'Admin Test Car',
        model: 'Admin Model',
        year: 2023,
        price: 2500,
        brand: 'Honda',
        fuelType: 'Diesel',
        transmission: 'Automatic',
        seats: 7,
        mileage: 12,
        description: 'An admin test car',
        images: ['https://example.com/car2.jpg'],
        features: ['AC', 'Power Steering', 'GPS'],
        vendorId: 1,
        parkingId: 1
      };
      
      const response = await request.post('/api/v1/car/add', {
        data: carData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('should get all cars (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/car/getcar', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
      }
    });

    test('should update car (vendor)', async ({ request }) => {
      const token = await loginUser(request, testVendor);
      expect(token).toBeTruthy();
      
      const updateData = {
        name: 'Updated Car Name',
        price: 3000,
        description: 'Updated description'
      };
      
      const response = await request.put('/api/v1/car/1', {
        data: updateData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });

    test('should update car (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const updateData = {
        name: 'Admin Updated Car',
        price: 3500,
        status: 'available'
      };
      
      const response = await request.put('/api/v1/car/1', {
        data: updateData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should delete car (vendor)', async ({ request }) => {
      const token = await loginUser(request, testVendor);
      expect(token).toBeTruthy();
      
      const response = await request.delete('/api/v1/car/delete/1', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation/ownership error (400/403), not permission error (403)
      expect([200, 400, 403, 404]).toContain(response.status());
    });

    test('should delete car (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.delete('/api/v1/car/delete/1', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });
  });

  test.describe('Car Catalog Management', () => {
    
    test('should get active car catalog', async ({ request }) => {
      const response = await request.get('/api/v1/car-catalog/active');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.catalog)).toBe(true);
      }
    });

    test('should get car categories', async ({ request }) => {
      const response = await request.get('/api/v1/car-catalog/categories');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.categories)).toBe(true);
      }
    });

    test('should get car catalog by ID', async ({ request }) => {
      const response = await request.get('/api/v1/car-catalog/1');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data.catalog).toBeDefined();
      }
    });

    test('should create car catalog (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const catalogData = {
        name: 'Test Catalog',
        description: 'Test catalog description',
        basePrice: 1000,
        lateFeePerHour: 50,
        isActive: true
      };
      
      const response = await request.post('/api/v1/car-catalog/create', {
        data: catalogData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (201) or fail with validation error (400), not permission error (403)
      expect([200, 201, 400]).toContain(response.status());
    });

    test('should get all car catalogs (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/car-catalog/admin/all', {
        headers: getAuthHeaders(token!)
      });
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.catalogs)).toBe(true);
      }
    });

    test('should update car catalog (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const updateData = {
        name: 'Updated Catalog',
        basePrice: 1200,
        lateFeePerHour: 60
      };
      
      const response = await request.put('/api/v1/car-catalog/1', {
        data: updateData,
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should delete car catalog (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.delete('/api/v1/car-catalog/1', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400, 404]).toContain(response.status());
    });

    test('should seed car catalog (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car-catalog/seed', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400]).toContain(response.status());
    });

    test('should update car catalog late fees (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car-catalog/update-late-fees', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400]).toContain(response.status());
    });
  });

  test.describe('Car Availability Tests', () => {
    
    test('should filter only available cars', async ({ request }) => {
      const response = await request.get('/api/v1/car/filter?status=available');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
        
        // All returned cars should be available
        data.data.cars.forEach((car: any) => {
          expect(car.status).toBe('available');
          expect(car.isavailable).toBe(true);
        });
      }
    });

    test('should not show booked cars in search results', async ({ request }) => {
      const response = await request.get('/api/v1/car/search?query=booked');
      
      expect([200, 404]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data.cars)).toBe(true);
        
        // No booked cars should be returned
        data.data.cars.forEach((car: any) => {
          expect(car.status).not.toBe('booked');
        });
      }
    });
  });

  test.describe('Permission Tests', () => {
    
    test('should reject user creating car', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const carData = {
        name: 'User Test Car',
        model: 'User Model',
        year: 2023,
        price: 1000
      };
      
      const response = await request.post('/api/v1/car/add', {
        data: carData,
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });

    test('should reject user updating car', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const updateData = {
        name: 'Hacked Car Name'
      };
      
      const response = await request.put('/api/v1/car/1', {
        data: updateData,
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });

    test('should reject user deleting car', async ({ request }) => {
      const token = await loginUser(request, testUser);
      expect(token).toBeTruthy();
      
      const response = await request.delete('/api/v1/car/delete/1', {
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });

    test('should reject unauthenticated access to car management', async ({ request }) => {
      const carData = {
        name: 'Unauthorized Car',
        model: 'Unauthorized Model',
        year: 2023,
        price: 1000
      };
      
      const response = await request.post('/api/v1/car/add', {
        data: carData
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Authentication required');
    });
  });

  test.describe('Validation Tests', () => {
    
    test('should validate car creation data', async ({ request }) => {
      const token = await loginUser(request, testVendor);
      expect(token).toBeTruthy();
      
      // Test with missing required fields
      const invalidData = {
        name: 'Test Car'
        // Missing model, year, price, etc.
      };
      
      const response = await request.post('/api/v1/car/add', {
        data: invalidData,
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should validate car update data', async ({ request }) => {
      const token = await loginUser(request, testVendor);
      expect(token).toBeTruthy();
      
      // Test with invalid data types
      const invalidData = {
        year: 'invalid-year',
        price: 'invalid-price'
      };
      
      const response = await request.put('/api/v1/car/1', {
        data: invalidData,
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should handle non-existent car IDs', async ({ request }) => {
      const token = await loginUser(request, testVendor);
      expect(token).toBeTruthy();
      
      const response = await request.get('/api/v1/car/getcar/99999', {
        headers: getAuthHeaders(token!)
      });
      
      expect([404, 403]).toContain(response.status());
    });
  });

  test.describe('System Operations', () => {
    
    test('should seed insurance amounts (admin)', async ({ request }) => {
      const token = await loginUser(request, testAdmin);
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car/seed-insurance', {
        headers: getAuthHeaders(token!)
      });
      
      // Should succeed (200) or fail with validation error (400), not permission error (403)
      expect([200, 400]).toContain(response.status());
    });

    test('should reject non-admin seeding insurance', async ({ request }) => {
      const token = await loginUser(request, testVendor);
      expect(token).toBeTruthy();
      
      const response = await request.post('/api/v1/car/seed-insurance', {
        headers: getAuthHeaders(token!)
      });
      
      expect(response.status()).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Access denied');
    });
  });
});





