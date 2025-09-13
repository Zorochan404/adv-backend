import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validateRequest } from '../utils/validation';
import { z } from 'zod';
import {
  getAllCars,
  getCarStats,
  getCarById,
  updateCarStatus,
  deleteCar,
  getCarsByBookingDateRange
} from './admincarscontroller';

const router = Router();

// Validation schemas
const carStatusSchema = z.object({
  status: z.enum(['available', 'rented', 'maintenance', 'out_of_service'])
});

const bookingDateRangeSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

const carQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['all', 'available', 'rented', 'maintenance', 'out_of_service']).optional(),
  popularOnly: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional()
});

const carParamsSchema = z.object({
  id: z.coerce.number().positive()
});

// Apply authentication and admin middleware to all routes
router.use(verifyJWT);
router.use(requireAdmin);

// GET /api/v1/admin/cars - Get all cars with filtering and search
router.get(
  '/',
  validateRequest(carQuerySchema),
  getAllCars
);

// GET /api/v1/admin/cars/stats - Get car statistics
router.get(
  '/stats',
  getCarStats
);

// GET /api/v1/admin/cars/:id - Get single car details
router.get(
  '/:id',
  validateRequest(carParamsSchema),
  getCarById
);

// PUT /api/v1/admin/cars/:id/status - Update car status
router.put(
  '/:id/status',
  validateRequest(carStatusSchema),
  validateRequest(carParamsSchema),
  updateCarStatus
);

// DELETE /api/v1/admin/cars/:id - Delete car
router.delete(
  '/:id',
  validateRequest(carParamsSchema),
  deleteCar
);

// POST /api/v1/admin/cars/filter-by-bookings - Filter cars by booking date range
router.post(
  '/filter-by-bookings',
  validateRequest(bookingDateRangeSchema),
  getCarsByBookingDateRange
);

export default router;
