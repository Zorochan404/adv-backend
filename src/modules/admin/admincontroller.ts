import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { bookingsTable as bookings } from "../booking/bookingmodel";
import { carModel as car } from "../car/carmodel";
import { UserTable as users } from "../user/usermodel";
import { parkingTable as parkings } from "../parking/parkingmodel";
import { reviewModel as review } from "../review/reviewmodel";
import { eq, gte, desc, count, sum, and, sql } from "drizzle-orm";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";

// Types for dashboard data
interface DashboardMetrics {
  totalRevenue: number;
  activeBookingsCount: number;
  totalUsersCount: number;
  carAvailability: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    outOfService: number;
    availabilityRate: string;
  };
  parkingUtilization: Array<{
    name: string;
    cars: number;
    capacity: number;
    utilization: number;
    available: number;
  }>;
  revenueByCarType: Array<{
    type: string;
    revenue: number;
    bookings: number;
  }>;
  chartData: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  recentBookings: Array<any>;
}

interface FilterPeriod {
  period?: 'today' | 'week' | 'month';
}

// Helper function to get date range based on period
function getDateRange(period: 'today' | 'week' | 'month') {
  const now = new Date();
  const startDate = new Date();
  
  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'month':
      startDate.setDate(now.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
  }
  
  return { startDate, endDate: now };
}

// Main dashboard endpoint - comprehensive data
export const getDashboardData = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'week' } = req.query as FilterPeriod;
  const { startDate, endDate } = getDateRange(period);

  try {
    // Fetch all data in parallel for better performance
    const [
      bookingsData,
      carsData,
      usersData,
      parkingData,
      filteredBookingsData
    ] = await Promise.all([
      // All bookings for recent activity
      db.select()
        .from(bookings)
        .orderBy(desc(bookings.createdAt))
        .limit(10),

      // All cars for availability calculation
      db.select()
        .from(car),

      // All users count
      db.select({ count: count() })
        .from(users),

      // All parking spots
      db.select()
        .from(parkings),

      // Filtered bookings for period-based calculations
      db.select()
        .from(bookings)
        .where(and(
          gte(bookings.createdAt, startDate),
          sql`${bookings.createdAt} <= ${endDate}`
        ))
    ]);

    // Calculate metrics
    const totalRevenue = filteredBookingsData.reduce((sum, booking) => 
      sum + (booking.totalPrice || 0), 0
    );

    const activeBookingsCount = bookingsData.filter(b => b.status === 'active').length;

    const totalUsersCount = usersData[0]?.count || 0;

    // Car availability calculation
    const totalCars = carsData.length;
    const availableCars = carsData.filter(c => c.isavailable).length;
    const rentedCars = carsData.filter(c => c.status === 'booked').length;
    const maintenanceCars = carsData.filter(c => c.status === 'maintenance').length;
    const outOfServiceCars = carsData.filter(c => c.status === 'unavailable').length;
    const availabilityRate = totalCars > 0 ? ((availableCars / totalCars) * 100).toFixed(1) : '0.0';

    // Parking utilization calculation
    const parkingUtilization = parkingData.map(spot => {
      const carsAtSpot = carsData.filter(car => car.parkingid === spot.id);
      const utilization = spot.capacity ? ((carsAtSpot.length / spot.capacity) * 100) : 0;
      return {
        name: spot.name,
        cars: carsAtSpot.length,
        capacity: spot.capacity,
        utilization: parseFloat(utilization.toFixed(1)),
        available: spot.capacity - carsAtSpot.length
      };
    });

    // Revenue by car type
    const revenueByCarTypeMap: Record<string, { revenue: number, bookings: number }> = {};
    filteredBookingsData.forEach(booking => {
      const car = carsData.find(c => c.id === booking.carId);
      const carType = car?.name || 'Unknown';
      if (!revenueByCarTypeMap[carType]) {
        revenueByCarTypeMap[carType] = { revenue: 0, bookings: 0 };
      }
      revenueByCarTypeMap[carType].revenue += booking.totalPrice || 0;
      revenueByCarTypeMap[carType].bookings += 1;
    });

    const revenueByCarType = Object.entries(revenueByCarTypeMap).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      revenue: data.revenue,
      bookings: data.bookings
    }));

    // Generate chart data
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    const chartData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = filteredBookingsData.filter(b => {
        const created = b.createdAt ? new Date(b.createdAt) : null;
        const bookingDateStr = created ? created.toISOString().split('T')[0] : '';
        return bookingDateStr === dateStr;
      });
      
      chartData.push({
        date: dateStr,
        revenue: dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        bookings: dayBookings.length
      });
    }

    // Get all users for recent bookings
    const allUsers = await db.select().from(users);
    
    // Recent bookings with car and user details
    const recentBookings = bookingsData.slice(0, 5).map(booking => {
      const car = carsData.find(c => c.id === booking.carId);
      const user = allUsers.find(u => u.id === booking.userId);
      
      return {
        id: booking.id,
        status: booking.status,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt,
        car: car ? {
          name: car.name,
          number: car.number,
          id: car.id
        } : null,
        user: user ? {
          name: user.name
        } : null
      };
    });

    const dashboardData: DashboardMetrics = {
      totalRevenue,
      activeBookingsCount,
      totalUsersCount,
      carAvailability: {
        total: totalCars,
        available: availableCars,
        rented: rentedCars,
        maintenance: maintenanceCars,
        outOfService: outOfServiceCars,
        availabilityRate
      },
      parkingUtilization,
      revenueByCarType,
      chartData,
      recentBookings
    };

    return res.status(200).json(
      new ApiResponse(200, dashboardData, "Dashboard data retrieved successfully")
    );

  } catch (error) {
    console.error('Dashboard data error:', error);
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to retrieve dashboard data")
    );
  }
});

// Granular endpoints for specific dashboard widgets

// Get key metrics only
export const getDashboardMetrics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'week' } = req.query as FilterPeriod;
  const { startDate, endDate } = getDateRange(period);

  try {
    const [
      filteredBookingsData,
      carsData,
      usersData
    ] = await Promise.all([
      db.select()
        .from(bookings)
        .where(and(
          gte(bookings.createdAt, startDate),
          sql`${bookings.createdAt} <= ${endDate}`
        )),
      db.select().from(car),
      db.select({ count: count() }).from(users)
    ]);

    const totalRevenue = filteredBookingsData.reduce((sum, booking) => 
      sum + (booking.totalPrice || 0), 0
    );

    const activeBookingsCount = filteredBookingsData.filter(b => b.status === 'active').length;
    const totalUsersCount = usersData[0]?.count || 0;

    const totalCars = carsData.length;
    const availableCars = carsData.filter(c => c.isavailable).length;
    const availabilityRate = totalCars > 0 ? ((availableCars / totalCars) * 100).toFixed(1) : '0.0';

    const metrics = {
      totalRevenue,
      activeBookingsCount,
      totalUsersCount,
      carAvailability: {
        total: totalCars,
        available: availableCars,
        availabilityRate
      }
    };

    return res.status(200).json(
      new ApiResponse(200, metrics, "Dashboard metrics retrieved successfully")
    );

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to retrieve dashboard metrics")
    );
  }
});

// Get car availability status
export const getCarAvailability = asyncHandler(async (req: Request, res: Response) => {
  try {
    const carsData = await db.select().from(car);

    const totalCars = carsData.length;
    const availableCars = carsData.filter(c => c.isavailable).length;
    const rentedCars = carsData.filter(c => c.status === 'booked').length;
    const maintenanceCars = carsData.filter(c => c.status === 'maintenance').length;
    const outOfServiceCars = carsData.filter(c => c.status === 'unavailable').length;
    const availabilityRate = totalCars > 0 ? ((availableCars / totalCars) * 100).toFixed(1) : '0.0';

    const carAvailability = {
      total: totalCars,
      available: availableCars,
      rented: rentedCars,
      maintenance: maintenanceCars,
      outOfService: outOfServiceCars,
      availabilityRate
    };

    return res.status(200).json(
      new ApiResponse(200, carAvailability, "Car availability data retrieved successfully")
    );

  } catch (error) {
    console.error('Car availability error:', error);
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to retrieve car availability data")
    );
  }
});

// Get parking utilization
export const getParkingUtilization = asyncHandler(async (req: Request, res: Response) => {
  try {
    const [carsData, parkingData] = await Promise.all([
      db.select().from(car),
      db.select().from(parkings)
    ]);

    const parkingUtilization = parkingData.map(spot => {
      const carsAtSpot = carsData.filter(car => car.parkingid === spot.id);
      const utilization = spot.capacity ? ((carsAtSpot.length / spot.capacity) * 100) : 0;
      return {
        name: spot.name,
        cars: carsAtSpot.length,
        capacity: spot.capacity,
        utilization: parseFloat(utilization.toFixed(1)),
        available: spot.capacity - carsAtSpot.length
      };
    });

    return res.status(200).json(
      new ApiResponse(200, parkingUtilization, "Parking utilization data retrieved successfully")
    );

  } catch (error) {
    console.error('Parking utilization error:', error);
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to retrieve parking utilization data")
    );
  }
});

// Get revenue trends for charts
export const getRevenueTrends = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'week' } = req.query as FilterPeriod;
  const { startDate, endDate } = getDateRange(period);

  try {
    const [filteredBookingsData, carsData] = await Promise.all([
      db.select()
        .from(bookings)
        .where(and(
          gte(bookings.createdAt, startDate),
          sql`${bookings.createdAt} <= ${endDate}`
        )),
      db.select().from(car)
    ]);

    // Generate chart data
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    const chartData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = filteredBookingsData.filter(b => {
        const created = b.createdAt ? new Date(b.createdAt) : null;
        const bookingDateStr = created ? created.toISOString().split('T')[0] : '';
        return bookingDateStr === dateStr;
      });
      
      chartData.push({
        date: dateStr,
        revenue: dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
        bookings: dayBookings.length
      });
    }

    // Revenue by car type
    const revenueByCarTypeMap: Record<string, { revenue: number, bookings: number }> = {};
    filteredBookingsData.forEach(booking => {
      const car = carsData.find(c => c.id === booking.carId);
      const carType = car?.name || 'Unknown';
      if (!revenueByCarTypeMap[carType]) {
        revenueByCarTypeMap[carType] = { revenue: 0, bookings: 0 };
      }
      revenueByCarTypeMap[carType].revenue += booking.totalPrice || 0;
      revenueByCarTypeMap[carType].bookings += 1;
    });

    const revenueByCarType = Object.entries(revenueByCarTypeMap).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      revenue: data.revenue,
      bookings: data.bookings
    }));

    const trendsData = {
      chartData,
      revenueByCarType
    };

    return res.status(200).json(
      new ApiResponse(200, trendsData, "Revenue trends data retrieved successfully")
    );

  } catch (error) {
    console.error('Revenue trends error:', error);
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to retrieve revenue trends data")
    );
  }
});

// Get recent bookings
export const getRecentBookings = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 5 } = req.query;

  try {
    const [bookingsData, carsData, usersData] = await Promise.all([
      db.select()
        .from(bookings)
        .orderBy(desc(bookings.createdAt))
        .limit(Number(limit)),
      db.select().from(car),
      db.select().from(users)
    ]);

    const recentBookings = bookingsData.map(booking => {
      const car = carsData.find(c => c.id === booking.carId);
      const user = usersData.find(u => u.id === booking.userId);
      
      return {
        id: booking.id,
        status: booking.status,
        totalPrice: booking.totalPrice,
        createdAt: booking.createdAt,
        car: car ? {
          name: car.name,
          number: car.number,
          id: car.id
        } : null,
        user: user ? {
          name: user.name
        } : null
      };
    });

    return res.status(200).json(
      new ApiResponse(200, recentBookings, "Recent bookings retrieved successfully")
    );

  } catch (error) {
    console.error('Recent bookings error:', error);
    return res.status(500).json(
      new ApiResponse(500, null, "Failed to retrieve recent bookings")
    );
  }
});
