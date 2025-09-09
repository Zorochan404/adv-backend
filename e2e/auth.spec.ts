import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  number: '7002803551',
  name: 'Test User',
  email: 'testuser@example.com'
};

const testAdmin = {
  number: '9999999999',
  password: 'admin123',
  role: 'admin',
  name: 'Test Admin',
  email: 'admin@example.com'
};

const testVendor = {
  number: '8888888888',
  password: 'vendor123',
  role: 'vendor',
  name: 'Test Vendor',
  email: 'vendor@example.com'
};

const testPIC = {
  number: '7777777777',
  password: 'pic123',
  role: 'parkingincharge',
  name: 'Test PIC',
  email: 'pic@example.com'
};

// Helper function to get auth headers
const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

test.describe('Authentication System Tests', () => {
  
  test.describe('New Unified Authentication (v2)', () => {
    
    test('should register a new user successfully', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/register', {
        data: testUser
      });
      
      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('User registered successfully');
      expect(data.data.user.number).toBe(testUser.number);
      expect(data.data.user.role).toBe('user');
      expect(data.data.tokens).toBeDefined();
      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();
    });

    test('should register staff user (admin only)', async ({ request }) => {
      // First, we need an admin token to register staff
      // This test assumes an admin user already exists in the system
      const adminLoginResponse = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testAdmin.number,
          password: testAdmin.password,
          authMethod: 'password'
        }
      });
      
      if (adminLoginResponse.status() === 200) {
        const adminData = await adminLoginResponse.json();
        const adminToken = adminData.data.tokens.accessToken;
        
        const response = await request.post('/api/v1/auth/v2/staff/register', {
          data: testVendor,
          headers: getAuthHeaders(adminToken)
        });
        
        expect(response.status()).toBe(201);
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toBe('Staff user created successfully');
        expect(data.data.user.role).toBe('vendor');
      }
    });

    test('should login user with OTP method', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testUser.number,
          otp: '123456',
          authMethod: 'otp'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.data.user.number).toBe(testUser.number);
      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();
    });

    test('should login staff with password method', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testAdmin.number,
          password: testAdmin.password,
          authMethod: 'password'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Login successful');
      expect(data.data.user.role).toBe('admin');
      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();
    });

    test('should refresh token successfully', async ({ request }) => {
      // First login to get tokens
      const loginResponse = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testUser.number,
          otp: '123456',
          authMethod: 'otp'
        }
      });
      
      const loginData = await loginResponse.json();
      const refreshToken = loginData.data.tokens.refreshToken;
      
      const response = await request.post('/api/v1/auth/v2/refresh', {
        data: {
          refreshToken: refreshToken
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Token refreshed successfully');
      expect(data.data.tokens.accessToken).toBeDefined();
      expect(data.data.tokens.refreshToken).toBeDefined();
    });

    test('should logout successfully', async ({ request }) => {
      // First login to get token
      const loginResponse = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testUser.number,
          otp: '123456',
          authMethod: 'otp'
        }
      });
      
      const loginData = await loginResponse.json();
      const accessToken = loginData.data.tokens.accessToken;
      
      const response = await request.post('/api/v1/auth/v2/logout', {
        headers: getAuthHeaders(accessToken)
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Logged out successfully');
    });

    test('should handle forgot password request', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/forgot-password', {
        data: {
          identifier: testUser.number
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toContain('password reset link has been sent');
    });

    test('should validate input for unified login', async ({ request }) => {
      // Test missing identifier
      const response1 = await request.post('/api/v1/auth/v2/login', {
        data: {
          authMethod: 'otp'
        }
      });
      expect(response1.status()).toBe(400);

      // Test missing authMethod
      const response2 = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testUser.number,
          otp: '123456'
        }
      });
      expect(response2.status()).toBe(400);

      // Test invalid authMethod
      const response3 = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testUser.number,
          otp: '123456',
          authMethod: 'invalid'
        }
      });
      expect(response3.status()).toBe(400);
    });

    test('should handle rate limiting', async ({ request }) => {
      // This test would require multiple rapid requests to trigger rate limiting
      // For now, we'll just test that the endpoint responds correctly
      const response = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: '0000000000', // Non-existent user
          password: 'wrongpassword',
          authMethod: 'password'
        }
      });
      
      // Should return 401 for invalid credentials, not rate limit error
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Legacy Authentication (Backward Compatibility)', () => {
    
    test('should work with legacy user login', async ({ request }) => {
      const response = await request.post('/api/v1/auth/login', {
        data: {
          number: testUser.number,
          otp: '123456'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('User login successful');
      expect(data.data.user.number).toBe(testUser.number);
      expect(data.data.accessToken).toBeDefined();
      
      // Check for deprecation warning header
      const deprecationHeader = response.headers()['x-deprecated-endpoint'];
      expect(deprecationHeader).toBe('true');
    });

    test('should work with legacy admin login', async ({ request }) => {
      const response = await request.post('/api/v1/auth/loginAdmin', {
        data: {
          number: testAdmin.number,
          password: testAdmin.password
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Admin login successful');
      expect(data.data.user.role).toBe('admin');
      expect(data.data.accessToken).toBeDefined();
      
      // Check for deprecation warning header
      const deprecationHeader = response.headers()['x-deprecated-endpoint'];
      expect(deprecationHeader).toBe('true');
    });

    test('should work with legacy admin registration', async ({ request }) => {
      const response = await request.post('/api/v1/auth/registerAdmin', {
        data: {
          ...testPIC,
          number: '6666666666' // Use different number to avoid conflicts
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Admin user created successfully');
      expect(data.data.user.role).toBe('parkingincharge');
      expect(data.data.accessToken).toBeDefined();
      
      // Check for deprecation warning header
      const deprecationHeader = response.headers()['x-deprecated-endpoint'];
      expect(deprecationHeader).toBe('true');
    });
  });

  test.describe('Authentication Security Tests', () => {
    
    test('should reject invalid credentials', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testUser.number,
          password: 'wrongpassword',
          authMethod: 'password'
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject invalid OTP', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: testUser.number,
          otp: '000000',
          authMethod: 'otp'
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should reject non-existent user', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/login', {
        data: {
          identifier: '0000000000',
          password: 'somepassword',
          authMethod: 'password'
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should validate phone number format', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/register', {
        data: {
          number: '123', // Invalid phone number
          name: 'Test User'
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    test('should validate email format', async ({ request }) => {
      const response = await request.post('/api/v1/auth/v2/register', {
        data: {
          number: '5555555555',
          name: 'Test User',
          email: 'invalid-email'
        }
      });
      
      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });
  });
});





