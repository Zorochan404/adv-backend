import { Request, Response } from "express";
import { carCatalogTable } from "./carmodel";
import { db } from "../../drizzle/db";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { eq, and, desc, asc } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Create car catalog entry (Admin only)
export const createCarCatalog = asyncHandler(
  async (
    req: Request & { user?: { id?: number; role?: string } },
    res: Response
  ) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can create car catalog entries");
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
        throw new ApiError(400, "Missing required fields");
      }

      const catalogEntry = await db
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
          createdBy: req.user.id,
        })
        .returning();

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            catalogEntry[0],
            "Car catalog entry created successfully"
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to create car catalog entry");
    }
  }
);

// Get all car catalog entries (with pagination and filtering)
export const getAllCarCatalog = asyncHandler(
  async (req: Request, res: Response) => {
    try {
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

      const totalPages = Math.ceil(total / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      const response = {
        catalogEntries,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalEntries: total,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
        },
      };

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            response,
            "Car catalog entries fetched successfully"
          )
        );
    } catch (error) {
      console.log(error);
      throw new ApiError(500, "Failed to fetch car catalog entries");
    }
  }
);

// Get car catalog entry by ID
export const getCarCatalogById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const catalogEntry = await db
        .select()
        .from(carCatalogTable)
        .where(eq(carCatalogTable.id, parseInt(id)))
        .limit(1);

      if (!catalogEntry || catalogEntry.length === 0) {
        throw new ApiError(404, "Car catalog entry not found");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            catalogEntry[0],
            "Car catalog entry fetched successfully"
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to fetch car catalog entry");
    }
  }
);

// Update car catalog entry (Admin only)
export const updateCarCatalog = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can update car catalog entries");
      }

      const { id } = req.params;
      const updateData = { ...req.body };

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

      const updatedEntry = await db
        .update(carCatalogTable)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(carCatalogTable.id, parseInt(id)))
        .returning();

      if (!updatedEntry || updatedEntry.length === 0) {
        throw new ApiError(404, "Car catalog entry not found");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedEntry[0],
            "Car catalog entry updated successfully"
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to update car catalog entry");
    }
  }
);

// Delete car catalog entry (Admin only)
export const deleteCarCatalog = asyncHandler(
  async (req: Request & { user?: { role?: string } }, res: Response) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can delete car catalog entries");
      }

      const { id } = req.params;

      const deletedEntry = await db
        .delete(carCatalogTable)
        .where(eq(carCatalogTable.id, parseInt(id)))
        .returning();

      if (!deletedEntry || deletedEntry.length === 0) {
        throw new ApiError(404, "Car catalog entry not found");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            deletedEntry[0],
            "Car catalog entry deleted successfully"
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to delete car catalog entry");
    }
  }
);

// Get active car catalog entries for vendors
export const getActiveCarCatalog = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { category, fuelType, transmission } = req.query;

      // Build where conditions
      const conditions = [eq(carCatalogTable.isActive, true)];
      if (category)
        conditions.push(eq(carCatalogTable.category, category as string));
      if (fuelType)
        conditions.push(eq(carCatalogTable.fuelType, fuelType as any));
      if (transmission)
        conditions.push(eq(carCatalogTable.transmission, transmission as any));

      const catalogEntries = await db
        .select()
        .from(carCatalogTable)
        .where(and(...conditions))
        .orderBy(asc(carCatalogTable.carName));

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            catalogEntries,
            "Active car catalog entries fetched successfully"
          )
        );
    } catch (error) {
      console.log(error);
      throw new ApiError(500, "Failed to fetch active car catalog entries");
    }
  }
);

// Seed car catalog data for testing (Admin only)
export const seedCarCatalog = asyncHandler(
  async (
    req: Request & { user?: { id?: number; role?: string } },
    res: Response
  ) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can seed car catalog data");
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
        },
      ];

      const createdEntries = [];
      for (const data of seedData) {
        const entry = await db
          .insert(carCatalogTable)
          .values({
            ...data,
            createdBy: req.user.id,
          })
          .returning();
        createdEntries.push(entry[0]);
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            createdEntries,
            "Car catalog seeded successfully"
          )
        );
    } catch (error) {
      console.log(error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, "Failed to seed car catalog");
    }
  }
);
