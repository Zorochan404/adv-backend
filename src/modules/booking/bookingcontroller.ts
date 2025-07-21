import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { bookingsTable } from "./bookingmodel";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { eq, between, and, gte, lte } from "drizzle-orm";
import { carModel } from "../car/carmodel";

// Extend the Request interface to include 'user' property
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    // add other user properties if needed
  };
}

export const createBooking = asyncHandler (async (req: AuthenticatedRequest, res: Response) => {
   try {
    const carprice = await db.select().from(carModel).where(eq(carModel.id, req.body.carId));
    if(!carprice){
        return res.status(404).json(new ApiResponse(404, null, "Car not found"));
    }

    // Convert string dates to Date objects
    // Check if user is verified (assume user object may have isverified property)
    if ((req.user as any).isverified === false) {
        return res.status(403).json(new ApiResponse(403, null, "please login and verify your account to continue"));
    }
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    const extentiontill = req.body.extentiontill ? new Date(req.body.extentiontill) : null;
    
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const price = carprice[0].price * days;
    const totalPrice = price + (req.body.extensionPrice || 0);
    
    const booking = await db.insert(bookingsTable).values({
        ...req.body,
        userId: Number(req.user.id),
        price: price,
        totalPrice: totalPrice,
        startDate: startDate,
        endDate: endDate,
        extentiontill: extentiontill
    }).returning();
    if(!booking){
        return res.status(400).json(new ApiResponse(400, null, "Booking not created"));
    }
    const bookingdetails = await db.query.bookingsTable.findFirst({
        where: (bookingsTable, {eq}) => (eq(bookingsTable.id, booking[0].id)),
        with: {
            car: true,
            pickupParking: true,
            dropoffParking: true,
            user: true
        }
    })
    res.status(201).json(new ApiResponse(201, bookingdetails, "Booking created successfully"));
   } catch (error) {
    console.log(error);
    res.status(500).json(new ApiResponse(500, null, "Internal server error"));
   }
});


export const getBookings = asyncHandler (async (req: Request, res: Response) => {
    try {
        const booking = await db.select().from(bookingsTable);
        res.status(200).json(new ApiResponse(200, booking, "Bookings fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});


export const getBookingByDateRange = asyncHandler (async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.body;
        
        // Validate input
        if (!startDate || !endDate) {
            return res.status(400).json(new ApiResponse(400, null, "Start date and end date are required"));
        }
        
        // Convert string dates to Date objects
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
   
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid date format"));
        }

        const bookings = await db
            .query.bookingsTable.findMany({
                where: (bookingsTable, {and, lte, gte}) => and(
                    lte(bookingsTable.startDate, endDateObj),
                    gte(bookingsTable.endDate, startDateObj)
                ),
                with: {
                    car: true,
                    pickupParking: true,
                    dropoffParking: true,
                    user: true
                }
            })
            
        
        res.status(200).json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});


export const getBookingByDateRangeByCarId = asyncHandler (async (req: Request, res: Response) => {
    try {
        const { startDate, endDate } = req.body;
        
        // Validate input
        if (!startDate || !endDate) {
            return res.status(400).json(new ApiResponse(400, null, "Start date and end date are required"));
        }
        
        // Convert string dates to Date objects
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
   
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
            return res.status(400).json(new ApiResponse(400, null, "Invalid date format"));
        }

        const bookings = await db
            .query.bookingsTable.findMany({
                where: (bookingsTable, {eq, and, lte, gte}) => and(
                    eq(bookingsTable.carId, parseInt(req.params.id)),
                    lte(bookingsTable.startDate, endDateObj),
                    gte(bookingsTable.endDate, startDateObj)
                ),
                with: {
                    car: true,
                    pickupParking: true,
                    dropoffParking: true,
                    user: true
                }
            })
            
        
        res.status(200).json(new ApiResponse(200, bookings, "Bookings fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});



export const getbookingbyid = asyncHandler (async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Import required models
        const { carModel } = await import("../car/carmodel");
        const { parkingTable } = await import("../parking/parkingmodel");
        const { UserTable } = await import("../user/usermodel");
        
        // Get booking with car and user details
        const booking = await db
            .select({
                // Booking details
                id: bookingsTable.id,
                userId: bookingsTable.userId,
                carId: bookingsTable.carId,
                startDate: bookingsTable.startDate,
                endDate: bookingsTable.endDate,
                price: bookingsTable.price,
                totalPrice: bookingsTable.totalPrice,
                extensionPrice: bookingsTable.extensionPrice,
                extentiontill: bookingsTable.extentiontill,
                extentiontime: bookingsTable.extentiontime,
                status: bookingsTable.status,
                pickupParkingId: bookingsTable.pickupParkingId,
                dropoffParkingId: bookingsTable.dropoffParkingId,
                createdAt: bookingsTable.createdAt,
                
                // Car details
                carName: carModel.name,
                carMaker: carModel.maker,
                carYear: carModel.year,
                carNumber: carModel.carnumber,
                carColor: carModel.color,
                carTransmission: carModel.transmission,
                carFuel: carModel.fuel,
                carType: carModel.type,
                carSeats: carModel.seats,
                carMainImg: carModel.mainimg,
                carImages: carModel.images,
                carPrice: carModel.price,
                carDiscountedPrice: carModel.discountedprice,
                carIsAvailable: carModel.isavailable,
                carIsApproved: carModel.isapproved,
                
                // User details
                userName: UserTable.name,
                userEmail: UserTable.email,
                userNumber: UserTable.number
            })
            .from(bookingsTable)
            .leftJoin(carModel, eq(bookingsTable.carId, carModel.id))
            .leftJoin(UserTable, eq(bookingsTable.userId, UserTable.id))
            .where(eq(bookingsTable.id, parseInt(id)));
        
        if (booking.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Booking not found"));
        }
        
        // Get pickup parking details
        let pickupParking = null;
        if (booking[0].pickupParkingId) {
            const pickupResult = await db
                .select({
                    id: parkingTable.id,
                    name: parkingTable.name,
                    locality: parkingTable.locality,
                    city: parkingTable.city,
                    state: parkingTable.state,
                    country: parkingTable.country,
                    pincode: parkingTable.pincode,
                    capacity: parkingTable.capacity,
                    mainimg: parkingTable.mainimg,
                    images: parkingTable.images,
                    lat: parkingTable.lat,
                    lng: parkingTable.lng
                })
                .from(parkingTable)
                .where(eq(parkingTable.id, booking[0].pickupParkingId));
            
            pickupParking = pickupResult[0] || null;
        }
        
        // Get dropoff parking details
        let dropoffParking = null;
        if (booking[0].dropoffParkingId) {
            const dropoffResult = await db
                .select({
                    id: parkingTable.id,
                    name: parkingTable.name,
                    locality: parkingTable.locality,
                    city: parkingTable.city,
                    state: parkingTable.state,
                    country: parkingTable.country,
                    pincode: parkingTable.pincode,
                    capacity: parkingTable.capacity,
                    mainimg: parkingTable.mainimg,
                    images: parkingTable.images,
                    lat: parkingTable.lat,
                    lng: parkingTable.lng
                })
                .from(parkingTable)
                .where(eq(parkingTable.id, booking[0].dropoffParkingId));
            
            dropoffParking = dropoffResult[0] || null;
        }
        
        // Combine the data
        const result = {
            ...booking[0],
            pickupParking,
            dropoffParking
        };
        
        res.status(200).json(new ApiResponse(200, result, "Booking with details fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});

export const updatebooking = asyncHandler (async (req: Request, res: Response) => {
    try {
        const booking = await db.update(bookingsTable).set(req.body).where(eq(bookingsTable.id, parseInt(req.params.id)));
        res.status(200).json(new ApiResponse(200, booking, "Booking updated successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});


export const deletebooking = asyncHandler (async (req: Request, res: Response) => {
    try {
        const booking = await db.delete(bookingsTable).where(eq(bookingsTable.id, parseInt(req.params.id)));
        res.status(200).json(new ApiResponse(200, booking, "Booking deleted successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});


export const getbookingbystatus = asyncHandler (async (req: Request, res: Response) => {
    try {
        const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.status, req.body.status));
        res.status(200).json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});

export const getbookingbyuserid = asyncHandler (async (req: Request, res: Response) => {
    try {
        const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.userId, parseInt(req.params.id)));
        res.status(200).json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});


export const getbookingbycarid = asyncHandler (async (req: Request, res: Response) => {
    try {
        const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.carId, parseInt(req.params.id)));
        res.status(200).json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});




//admin routes
export const getbookingbypickupParkingId = asyncHandler (async (req: Request, res: Response) => {
    try {
        // Fix: Properly check user role and handle missing req.user
        const user = (req as any).user;
        console.log(user);
        if (!user || (user.role !== "admin" && user.role !== "parkingincharge")) {
            return res.status(403).json(new ApiResponse(403, null, "You are not authorized to access this resource"));
        }
        const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.pickupParkingId, parseInt(req.params.id)));
        res.status(200).json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});

export const getbookingbydropoffParkingId = asyncHandler (async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        console.log(user);
        if (!user || (user.role !== "admin" && user.role !== "parkingincharge")) {
            return res.status(403).json(new ApiResponse(403, null, "You are not authorized to access this resource"));
        }
        const booking = await db.select().from(bookingsTable).where(eq(bookingsTable.dropoffParkingId, parseInt(req.params.id)));
        res.status(200).json(new ApiResponse(200, booking, "Booking fetched successfully"));
    } catch (error) {
        console.log(error);
        res.status(500).json(new ApiResponse(500, null, "Internal server error"));
    }
});
