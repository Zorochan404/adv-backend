import { setupTestDatabase, teardownTestDatabase, cleanupTestData, getTestDatabase } from './setup';
import { parkingTable } from '../src/modules/parking/parkingmodel';
import { eq } from 'drizzle-orm';

describe('Parking Database Integration Tests', () => {
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

  describe('Parking CRUD Operations', () => {
    it('should create and retrieve parking', async () => {
      const db = getTestDatabase();
      
      // Create test parking data
      const testParking = {
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
      };

      // Insert test data
      const result = await db.insert(parkingTable).values(testParking).returning();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: testParking.name,
        locality: testParking.locality,
        city: testParking.city,
        state: testParking.state,
        country: testParking.country,
        pincode: testParking.pincode,
        capacity: testParking.capacity,
        lat: testParking.lat,
        lng: testParking.lng,
        mainimg: testParking.mainimg,
        images: testParking.images
      });

      // Retrieve the parking
      const retrievedParking = await db.select().from(parkingTable);
      expect(retrievedParking).toHaveLength(1);
      expect(retrievedParking[0]).toMatchObject(testParking);
    });

    it('should create multiple parking locations', async () => {
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

      // Insert test data
      const result = await db.insert(parkingTable).values(testParking).returning();
      expect(result).toHaveLength(2);

      // Retrieve all parking
      const retrievedParking = await db.select().from(parkingTable);
      expect(retrievedParking).toHaveLength(2);
    });

    it('should filter parking by city', async () => {
      const db = getTestDatabase();
      
      // Create test parking data with different cities
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

      // Filter by city using Drizzle
      const mumbaiResults = await db.select().from(parkingTable).where(
        eq(parkingTable.city, 'Mumbai')
      );
      
      expect(mumbaiResults).toHaveLength(1);
      expect(mumbaiResults[0].city).toBe('Mumbai');
    });

    it('should update parking information', async () => {
      const db = getTestDatabase();
      
      // Create test parking
      const testParking = {
        name: 'Original Parking',
        locality: 'Original Locality',
        city: 'Original City',
        state: 'Original State',
        country: 'Original Country',
        pincode: 123456,
        capacity: 50,
        lat: 12.9716,
        lng: 77.5946,
        mainimg: 'original-image.jpg',
        images: ['original1.jpg', 'original2.jpg']
      };

      const result = await db.insert(parkingTable).values(testParking).returning();
      const parkingId = result[0].id;

      // Update parking
      const updateData = {
        name: 'Updated Parking',
        capacity: 100
      };

      const updatedResult = await db.update(parkingTable)
        .set(updateData)
        .where(eq(parkingTable.id, parkingId))
        .returning();

      expect(updatedResult).toHaveLength(1);
      expect(updatedResult[0].name).toBe('Updated Parking');
      expect(updatedResult[0].capacity).toBe(100);
      expect(updatedResult[0].locality).toBe('Original Locality'); // Should remain unchanged
    });

    it('should delete parking', async () => {
      const db = getTestDatabase();
      
      // Create test parking
      const testParking = {
        name: 'Parking to Delete',
        locality: 'Delete Locality',
        city: 'Delete City',
        state: 'Delete State',
        country: 'Delete Country',
        pincode: 123456,
        capacity: 50,
        lat: 12.9716,
        lng: 77.5946,
        mainimg: 'delete-image.jpg',
        images: ['delete1.jpg', 'delete2.jpg']
      };

      const result = await db.insert(parkingTable).values(testParking).returning();
      const parkingId = result[0].id;

      // Verify parking exists
      const beforeDelete = await db.select().from(parkingTable);
      expect(beforeDelete).toHaveLength(1);

      // Delete parking
      const deletedResult = await db.delete(parkingTable)
        .where(eq(parkingTable.id, parkingId))
        .returning();

      expect(deletedResult).toHaveLength(1);
      expect(deletedResult[0].id).toBe(parkingId);

      // Verify parking is deleted
      const afterDelete = await db.select().from(parkingTable);
      expect(afterDelete).toHaveLength(0);
    });
  });
});
