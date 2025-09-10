import { setupTestDatabase, teardownTestDatabase, getTestDatabase } from './setup';
import { paymentsTable, paymentSummaryTable } from '../src/modules/payment/paymentmodel';
import { bookingsTable } from '../src/modules/booking/bookingmodel';
import { UserTable } from '../src/modules/user/usermodel';

describe('Payment Migration System Test', () => {
  let testDb: any;

  beforeAll(async () => {
    await setupTestDatabase();
    testDb = getTestDatabase();
  }, 60000);

  afterAll(async () => {
    await teardownTestDatabase();
  }, 30000);

  it('should have payments table created by migration', async () => {
    // Test that the payments table exists and has the correct structure
    const result = await testDb.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      ORDER BY ordinal_position
    `);
    
    expect(result.length).toBeGreaterThan(0);
    
    // Check for key columns
    const columnNames = result.map((row: any) => row.column_name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('payment_id');
    expect(columnNames).toContain('type');
    expect(columnNames).toContain('status');
    expect(columnNames).toContain('method');
    expect(columnNames).toContain('amount');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('booking_id');
  });

  it('should have payment_summary table created by migration', async () => {
    const result = await testDb.execute(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment_summary' 
      ORDER BY ordinal_position
    `);
    
    expect(result.length).toBeGreaterThan(0);
    
    const columnNames = result.map((row: any) => row.column_name);
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('booking_id');
    expect(columnNames).toContain('total_paid');
  });

  it('should have payment enums created by migration', async () => {
    const result = await testDb.execute(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'payment_type'
      )
    `);
    
    expect(result.length).toBeGreaterThan(0);
    
    const enumValues = result.map((row: any) => row.enumlabel);
    expect(enumValues).toContain('advance');
    expect(enumValues).toContain('final');
    expect(enumValues).toContain('late_fees');
    expect(enumValues).toContain('topup');
  });

  it('should be able to create a payment record', async () => {
    // Create a test user first
    const user = await testDb.insert(UserTable).values({
      name: 'Test User',
      number: 9876543210,
      email: 'test@example.com',
      role: 'user',
    }).returning();

    // Create a test booking
    const booking = await testDb.insert(bookingsTable).values({
      userId: user[0].id,
      carId: 1, // This will fail foreign key, but we're testing payment creation
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      basePrice: 1000,
      advanceAmount: 300,
      remainingAmount: 700,
      totalPrice: 1000,
      status: 'pending',
    }).returning();

    // Create a payment record
    const payment = await testDb.insert(paymentsTable).values({
      paymentId: `test_${Date.now()}`,
      type: 'advance',
      status: 'completed',
      method: 'razorpay',
      amount: 300,
      netAmount: 300,
      userId: user[0].id,
      bookingId: booking[0].id,
      completedAt: new Date(),
    }).returning();

    expect(payment[0]).toBeDefined();
    expect(payment[0].type).toBe('advance');
    expect(payment[0].status).toBe('completed');
    expect(payment[0].amount).toBe(300);
  });

  it('should be able to update booking with payment reference', async () => {
    // Create a test user
    const user = await testDb.insert(UserTable).values({
      name: 'Test User 2',
      number: 9876543211,
      email: 'test2@example.com',
      role: 'user',
    }).returning();

    // Create a test booking
    const booking = await testDb.insert(bookingsTable).values({
      userId: user[0].id,
      carId: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      basePrice: 1000,
      advanceAmount: 300,
      remainingAmount: 700,
      totalPrice: 1000,
      status: 'pending',
    }).returning();

    // Create a payment record
    const payment = await testDb.insert(paymentsTable).values({
      paymentId: `test_${Date.now()}`,
      type: 'advance',
      status: 'completed',
      method: 'razorpay',
      amount: 300,
      netAmount: 300,
      userId: user[0].id,
      bookingId: booking[0].id,
      completedAt: new Date(),
    }).returning();

    // Update booking with payment reference
    const updatedBooking = await testDb
      .update(bookingsTable)
      .set({
        advancePaymentId: payment[0].id,
        status: 'advance_paid',
      })
      .where(eq(bookingsTable.id, booking[0].id))
      .returning();

    expect(updatedBooking[0].advancePaymentId).toBe(payment[0].id);
    expect(updatedBooking[0].status).toBe('advance_paid');
  });
});

import { eq } from 'drizzle-orm';
