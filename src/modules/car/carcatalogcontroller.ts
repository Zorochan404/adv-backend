import { Request, Response } from "express";
import { carCatalogTable } from "./carmodel";
import { db } from "../../drizzle/db";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import { eq, and, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  sendSuccess,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendItem,
  sendPaginated,
  sendList,
} from "../utils/responseHandler";
import { withDatabaseErrorHandling } from "../utils/dbErrorHandler";

// Create car catalog entry (Admin only)
export const createCarCatalog = asyncHandler(
  async (
    req: Request & { user?: { id?: number; role?: string } },
    res: Response
  ) => {
    if (!req.user || req.user.role !== "admin") {
      throw ApiError.forbidden("Only admins can create car catalog entries");
    }

    const {
      carName,
      carMaker,
      carModelYear,
      carVendorPrice,
      carPlatformPrice,
      transmission,
      fuelType,
      seats,
      engineCapacity,
      mileage,
      features,
      imageUrl,
      category,
    } = req.body;

    // Validate required fields
    if (
      !carName ||
      !carMaker ||
      !carModelYear ||
      !carVendorPrice ||
      !carPlatformPrice
    ) {
      throw ApiError.badRequest("Missing required fields");
    }

    const catalogEntry = await withDatabaseErrorHandling(async () => {
      const newEntry = await db
        .insert(carCatalogTable)
        .values({
          carName: carName,
          carMaker: carMaker,
          carModelYear: parseInt(carModelYear),
          carVendorPrice: carVendorPrice.toString(),
          carPlatformPrice: carPlatformPrice.toString(),
          transmission: (transmission || "manual") as any,
          fuelType: (fuelType || "petrol") as any,
          seats: parseInt(seats) || 5,
          engineCapacity: engineCapacity,
          mileage: mileage,
          features: features,
          imageUrl: imageUrl,
          category: category || "sedan",
          createdBy: req.user!.id,
        })
        .returning();

      return newEntry[0];
    }, "createCarCatalog");

    return sendCreated(
      res,
      catalogEntry,
      "Car catalog entry created successfully"
    );
  }
);

// Get all car catalog entries (with pagination and filtering)
export const getAllCarCatalog = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      limit = 10,
      page = 1,
      category,
      fuelType,
      transmission,
      isActive = "true",
    } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 10, 50);
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const offset = (pageNum - 1) * limitNum;

    const result = await withDatabaseErrorHandling(async () => {
      // Build where conditions
      const conditions = [];
      if (category)
        conditions.push(eq(carCatalogTable.category, category as string));
      if (fuelType)
        conditions.push(eq(carCatalogTable.fuelType, fuelType as any));
      if (transmission)
        conditions.push(eq(carCatalogTable.transmission, transmission as any));
      if (isActive !== undefined) {
        conditions.push(eq(carCatalogTable.isActive, isActive === "true"));
      }

      // Get total count
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(carCatalogTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const total = totalCount[0]?.count || 0;

      // Get catalog entries
      const catalogEntries = await db
        .select()
        .from(carCatalogTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(carCatalogTable.createdAt))
        .limit(limitNum)
        .offset(offset);

      return { catalogEntries, total };
    }, "getAllCarCatalog");

    return sendPaginated(
      res,
      result.catalogEntries,
      result.total,
      pageNum,
      limitNum,
      "Car catalog entries fetched successfully"
    );
  }
);

// Get car catalog entry by ID
export const getCarCatalogById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid catalog ID");
    }

    const catalogEntry = await withDatabaseErrorHandling(async () => {
      const foundEntry = await db
        .select()
        .from(carCatalogTable)
        .where(eq(carCatalogTable.id, parseInt(id)))
        .limit(1);

      if (!foundEntry || foundEntry.length === 0) {
        throw ApiError.notFound("Car catalog entry not found");
      }

      return foundEntry[0];
    }, "getCarCatalogById");

    return sendItem(
      res,
      catalogEntry,
      "Car catalog entry fetched successfully"
    );
  }
);

// Update car catalog entry (Admin only)
export const updateCarCatalog = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw ApiError.forbidden("Only admins can update car catalog entries");
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid catalog ID");
    }

    // Convert numeric fields
    if (updateData.carModelYear) {
      updateData.carModelYear = parseInt(updateData.carModelYear);
    }
    if (updateData.carVendorPrice) {
      updateData.carVendorPrice = parseFloat(updateData.carVendorPrice);
    }
    if (updateData.carPlatformPrice) {
      updateData.carPlatformPrice = parseFloat(updateData.carPlatformPrice);
    }
    if (updateData.seats) {
      updateData.seats = parseInt(updateData.seats);
    }

    const updatedEntry = await withDatabaseErrorHandling(async () => {
      const result = await db
        .update(carCatalogTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(carCatalogTable.id, parseInt(id)))
        .returning();

      if (!result || result.length === 0) {
        throw ApiError.notFound("Car catalog entry not found");
      }

      return result[0];
    }, "updateCarCatalog");

    return sendUpdated(
      res,
      updatedEntry,
      "Car catalog entry updated successfully"
    );
  }
);

// Delete car catalog entry (Admin only)
export const deleteCarCatalog = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    if (!req.user || req.user.role !== "admin") {
      throw ApiError.forbidden("Only admins can delete car catalog entries");
    }

    const { id } = req.params;

    if (!id || !/^[0-9]+$/.test(id)) {
      throw ApiError.badRequest("Invalid catalog ID");
    }

    const deletedEntry = await withDatabaseErrorHandling(async () => {
      const result = await db
        .delete(carCatalogTable)
        .where(eq(carCatalogTable.id, parseInt(id)))
        .returning();

      if (!result || result.length === 0) {
        throw ApiError.notFound("Car catalog entry not found");
      }

      return result[0];
    }, "deleteCarCatalog");

    return sendDeleted(res, "Car catalog entry deleted successfully");
  }
);

// Get active car catalog entries for vendors
export const getActiveCarCatalog = asyncHandler(
  async (req: Request, res: Response) => {
    const { category, fuelType, transmission } = req.query;

    const catalogEntries = await withDatabaseErrorHandling(async () => {
      // Build where conditions
      const conditions = [eq(carCatalogTable.isActive, true)];
      if (category)
        conditions.push(eq(carCatalogTable.category, category as string));
      if (fuelType)
        conditions.push(eq(carCatalogTable.fuelType, fuelType as any));
      if (transmission)
        conditions.push(eq(carCatalogTable.transmission, transmission as any));

      return await db
        .select()
        .from(carCatalogTable)
        .where(and(...conditions))
        .orderBy(asc(carCatalogTable.carName));
    }, "getActiveCarCatalog");

    return sendList(
      res,
      catalogEntries,
      catalogEntries.length,
      "Active car catalog entries fetched successfully"
    );
  }
);

// Seed car catalog data for testing (Admin only)
export const seedCarCatalog = asyncHandler(
  async (
    req: Request & { user?: { id?: number; role?: string } },
    res: Response
  ) => {
    if (!req.user || req.user.role !== "admin") {
      throw ApiError.forbidden("Only admins can seed car catalog data");
    }

    const seedData = [
      {
        carName: "Honda City",
        carMaker: "Honda",
        carModelYear: 2023,
        carVendorPrice: "800.00",
        carPlatformPrice: "1200.00",
        transmission: "manual" as any,
        fuelType: "petrol" as any,
        seats: 5,
        engineCapacity: "1.5L",
        mileage: "18 kmpl",
        features: "AC, Power Steering, Music System, Airbags, Bluetooth",
        imageUrl:
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
        category: "sedan",
        lateFeeRate: "0.10", // 10% of daily rate per hour
      },
      {
        carName: "Maruti Swift",
        carMaker: "Maruti Suzuki",
        carModelYear: 2023,
        carVendorPrice: "600.00",
        carPlatformPrice: "900.00",
        transmission: "manual" as any,
        fuelType: "petrol" as any,
        seats: 5,
        engineCapacity: "1.2L",
        mileage: "22 kmpl",
        features: "AC, Power Steering, Music System, Airbags",
        imageUrl:
          "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500",
        category: "hatchback",
        lateFeeRate: "0.08", // 8% of daily rate per hour
      },
      {
        carName: "Toyota Innova Crysta",
        carMaker: "Toyota",
        carModelYear: 2023,
        carVendorPrice: "1200.00",
        carPlatformPrice: "1800.00",
        transmission: "automatic" as any,
        fuelType: "diesel" as any,
        seats: 7,
        engineCapacity: "2.4L",
        mileage: "12 kmpl",
        features:
          "AC, Power Steering, Music System, GPS, Leather Seats, Sunroof",
        imageUrl:
          "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500",
        category: "suv",
        lateFeeRate: "0.12", // 12% of daily rate per hour
      },
      {
        carName: "Hyundai i20",
        carMaker: "Hyundai",
        carModelYear: 2023,
        carVendorPrice: "700.00",
        carPlatformPrice: "1000.00",
        transmission: "manual" as any,
        fuelType: "petrol" as any,
        seats: 5,
        engineCapacity: "1.2L",
        mileage: "20 kmpl",
        features: "AC, Power Steering, Music System, Airbags, LED Headlamps",
        imageUrl:
          "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=500",
        category: "hatchback",
        lateFeeRate: "0.08", // 8% of daily rate per hour
      },
      {
        carName: "Mahindra XUV500",
        carMaker: "Mahindra",
        carModelYear: 2023,
        carVendorPrice: "1000.00",
        carPlatformPrice: "1500.00",
        transmission: "manual" as any,
        fuelType: "diesel" as any,
        seats: 7,
        engineCapacity: "2.2L",
        mileage: "15 kmpl",
        features: "AC, Power Steering, Music System, GPS, Sunroof, 4WD",
        imageUrl:
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
        category: "suv",
        lateFeeRate: "0.12", // 12% of daily rate per hour
      },
      {
        carName: "Kia Seltos",
        carMaker: "Kia",
        carModelYear: 2023,
        carVendorPrice: "900.00",
        carPlatformPrice: "1300.00",
        transmission: "automatic" as any,
        fuelType: "petrol" as any,
        seats: 5,
        engineCapacity: "1.5L",
        mileage: "16 kmpl",
        features:
          "AC, Power Steering, Music System, GPS, Panoramic Sunroof, LED DRLs",
        imageUrl:
          "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=500",
        category: "suv",
        lateFeeRate: "0.11", // 11% of daily rate per hour
      },
      {
        carName: "Tata Nexon EV",
        carMaker: "Tata",
        carModelYear: 2023,
        carVendorPrice: "800.00",
        carPlatformPrice: "1200.00",
        transmission: "automatic" as any,
        fuelType: "electric" as any,
        seats: 5,
        engineCapacity: "30.2 kWh",
        mileage: "312 km range",
        features:
          "AC, Power Steering, Music System, GPS, Fast Charging, Regenerative Braking",
        imageUrl:
          "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=500",
        category: "electric",
        lateFeeRate: "0.15", // 15% of daily rate per hour (higher for EVs)
      },
      {
        carName: "BMW 3 Series",
        carMaker: "BMW",
        carModelYear: 2023,
        carVendorPrice: "2000.00",
        carPlatformPrice: "3000.00",
        transmission: "automatic" as any,
        fuelType: "petrol" as any,
        seats: 5,
        engineCapacity: "2.0L",
        mileage: "14 kmpl",
        features:
          "AC, Power Steering, Music System, GPS, Leather Seats, Sport Mode, LED Headlamps",
        imageUrl:
          "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500",
        category: "luxury",
        lateFeeRate: "0.20", // 20% of daily rate per hour (higher for luxury cars)
      },
    ];

    const createdEntries = await withDatabaseErrorHandling(async () => {
      const entries = [];
      for (const data of seedData) {
        const entry = await db
          .insert(carCatalogTable)
          .values({
            ...data,
            createdBy: req.user!.id,
          })
          .returning();
        entries.push(entry[0]);
      }
      return entries;
    }, "seedCarCatalog");

    return sendCreated(res, createdEntries, "Car catalog seeded successfully");
  }
);

// Update existing car catalog entries with late fee rates
export const updateCarCatalogLateFees = asyncHandler(
  async (
    req: Request & { user?: { id?: number; role?: string } },
    res: Response
  ) => {
    if (!req.user || req.user.role !== "admin") {
      throw ApiError.forbidden("Only admins can update car catalog late fees");
    }

    const result = await withDatabaseErrorHandling(async () => {
      // Get all existing car catalog entries
      const existingEntries = await db.select().from(carCatalogTable);

      const updatedEntries = [];
      for (const entry of existingEntries) {
        let lateFeeRate = "0.10"; // Default 10%

        // Set late fee rates based on category
        switch (entry.category) {
          case "hatchback":
            lateFeeRate = "0.08"; // 8% for hatchbacks
            break;
          case "sedan":
            lateFeeRate = "0.10"; // 10% for sedans
            break;
          case "suv":
            lateFeeRate = "0.12"; // 12% for SUVs
            break;
          case "electric":
            lateFeeRate = "0.15"; // 15% for electric vehicles
            break;
          case "luxury":
            lateFeeRate = "0.20"; // 20% for luxury cars
            break;
          default:
            lateFeeRate = "0.10"; // Default 10%
        }

        // Update the entry with late fee rate
        const updatedEntry = await db
          .update(carCatalogTable)
          .set({
            lateFeeRate: lateFeeRate,
            updatedAt: new Date(),
          })
          .where(eq(carCatalogTable.id, entry.id))
          .returning();

        updatedEntries.push(updatedEntry[0]);
      }

      return updatedEntries;
    }, "updateCarCatalogLateFees");

    return sendSuccess(
      res,
      result,
      "Car catalog late fees updated successfully"
    );
  }
);
