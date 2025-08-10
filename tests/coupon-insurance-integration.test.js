/**
 * Integration Test for Coupon and Insurance Features
 * 
 * This script tests the complete flow of coupon application and insurance calculation
 * in the booking process.
 */

const axios = require('axios');
const assert = require('assert');

// Configuration
const API_URL = 'http://localhost:3000/api'; // Update with your API URL
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'adminpassword'
};
const USER_CREDENTIALS = {
  email: 'user@example.com',
  password: 'userpassword'
};

// Test data
const TEST_COUPON = {
  code: 'TEST25',
  discountAmount: 25,
  discountType: 'percentage',
  minBookingAmount: 1000,
  maxDiscountAmount: 500,
  startDate: new Date(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  usageLimit: 100,
  perUserLimit: 1,
  isActive: true,
  status: 'active'
};

// Helper functions
async function login(credentials) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, credentials);
    return response.data.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createCoupon(token) {
  try {
    const response = await axios.post(
      `${API_URL}/coupon/create`,
      TEST_COUPON,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error('Create coupon failed:', error.response?.data || error.message);
    throw error;
  }
}

async function seedInsuranceAmounts(token, defaultAmount = 500) {
  try {
    const response = await axios.post(
      `${API_URL}/car/seed-insurance`,
      { defaultAmount },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error('Seed insurance failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getAvailableCars(token) {
  try {
    const response = await axios.get(
      `${API_URL}/car/nearestavailablecars?latitude=12.9716&longitude=77.5946`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error('Get cars failed:', error.response?.data || error.message);
    throw error;
  }
}

async function createBooking(token, carId, couponCode = null) {
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
  
  const bookingData = {
    carId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    deliveryCharges: 100
  };
  
  if (couponCode) {
    bookingData.couponCode = couponCode;
  }
  
  try {
    const response = await axios.post(
      `${API_URL}/booking/create`,
      bookingData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error('Create booking failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getBookingById(token, bookingId) {
  try {
    const response = await axios.get(
      `${API_URL}/booking/getbookingbyid/${bookingId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  } catch (error) {
    console.error('Get booking failed:', error.response?.data || error.message);
    throw error;
  }
}

// Main test function
async function runTests() {
  console.log('Starting integration tests for coupon and insurance features...');
  
  try {
    // Step 1: Login as admin
    console.log('Logging in as admin...');
    const adminToken = await login(ADMIN_CREDENTIALS);
    console.log('✓ Admin login successful');
    
    // Step 2: Seed insurance amounts
    console.log('Seeding insurance amounts...');
    const seedResult = await seedInsuranceAmounts(adminToken);
    console.log(`✓ Insurance amounts seeded for ${seedResult.updated} cars`);
    
    // Step 3: Create test coupon
    console.log('Creating test coupon...');
    const coupon = await createCoupon(adminToken);
    console.log(`✓ Test coupon created with ID: ${coupon.id}`);
    
    // Step 4: Login as user
    console.log('Logging in as user...');
    const userToken = await login(USER_CREDENTIALS);
    console.log('✓ User login successful');
    
    // Step 5: Get available cars
    console.log('Getting available cars...');
    const cars = await getAvailableCars(userToken);
    if (!cars || cars.length === 0) {
      throw new Error('No available cars found');
    }
    const testCar = cars[0];
    console.log(`✓ Found available car with ID: ${testCar.id}`);
    
    // Step 6: Create booking without coupon
    console.log('Creating booking without coupon...');
    const bookingWithoutCoupon = await createBooking(userToken, testCar.id);
    console.log(`✓ Booking created without coupon, ID: ${bookingWithoutCoupon.id}`);
    
    // Step 7: Verify booking without coupon
    console.log('Verifying booking without coupon...');
    const bookingDetailsWithoutCoupon = await getBookingById(userToken, bookingWithoutCoupon.id);
    
    // Assertions for booking without coupon
    assert(bookingDetailsWithoutCoupon.billingBreakdown, 'Billing breakdown should exist');
    assert(bookingDetailsWithoutCoupon.billingBreakdown.insuranceAmount > 0, 'Insurance amount should be greater than 0');
    assert(!bookingDetailsWithoutCoupon.couponDetails, 'Coupon details should not exist');
    assert(bookingDetailsWithoutCoupon.billingBreakdown.discountAmount === 0, 'Discount amount should be 0');
    
    console.log('✓ Booking without coupon verified successfully');
    console.log('Billing breakdown:', bookingDetailsWithoutCoupon.billingBreakdown);
    
    // Step 8: Create booking with coupon
    console.log('Creating booking with coupon...');
    const bookingWithCoupon = await createBooking(userToken, testCar.id, TEST_COUPON.code);
    console.log(`✓ Booking created with coupon, ID: ${bookingWithCoupon.id}`);
    
    // Step 9: Verify booking with coupon
    console.log('Verifying booking with coupon...');
    const bookingDetailsWithCoupon = await getBookingById(userToken, bookingWithCoupon.id);
    
    // Assertions for booking with coupon
    assert(bookingDetailsWithCoupon.billingBreakdown, 'Billing breakdown should exist');
    assert(bookingDetailsWithCoupon.billingBreakdown.insuranceAmount > 0, 'Insurance amount should be greater than 0');
    assert(bookingDetailsWithCoupon.couponDetails, 'Coupon details should exist');
    assert(bookingDetailsWithCoupon.couponDetails.code === TEST_COUPON.code, 'Coupon code should match');
    assert(bookingDetailsWithCoupon.billingBreakdown.discountAmount > 0, 'Discount amount should be greater than 0');
    
    // Verify discount calculation
    const expectedDiscount = Math.min(
      bookingDetailsWithCoupon.billingBreakdown.basePrice * (TEST_COUPON.discountAmount / 100),
      TEST_COUPON.maxDiscountAmount
    );
    assert(
      Math.abs(bookingDetailsWithCoupon.billingBreakdown.discountAmount - expectedDiscount) < 1,
      'Discount amount should be calculated correctly'
    );
    
    // Verify total price calculation
    const expectedTotalBeforeDiscount = 
      bookingDetailsWithCoupon.billingBreakdown.basePrice + 
      bookingDetailsWithCoupon.billingBreakdown.insuranceAmount + 
      bookingDetailsWithCoupon.billingBreakdown.deliveryCharges;
      
    const expectedTotalPrice = expectedTotalBeforeDiscount - bookingDetailsWithCoupon.billingBreakdown.discountAmount;
    
    assert(
      Math.abs(bookingDetailsWithCoupon.billingBreakdown.totalBeforeDiscount - expectedTotalBeforeDiscount) < 1,
      'Total before discount should be calculated correctly'
    );
    
    assert(
      Math.abs(bookingDetailsWithCoupon.billingBreakdown.totalPrice - expectedTotalPrice) < 1,
      'Total price should be calculated correctly'
    );
    
    console.log('✓ Booking with coupon verified successfully');
    console.log('Billing breakdown:', bookingDetailsWithCoupon.billingBreakdown);
    console.log('Coupon details:', bookingDetailsWithCoupon.couponDetails);
    
    console.log('\nAll tests passed successfully! ✓');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
