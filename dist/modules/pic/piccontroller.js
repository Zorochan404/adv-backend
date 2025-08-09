"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDropoffCars = exports.getPickupCars = void 0;
const asyncHandler_1 = require("../utils/asyncHandler");
const apiResponse_1 = require("../utils/apiResponse");
// Get cars coming for pickup at PIC's parking lot
exports.getPickupCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // TODO: Implement actual logic to fetch pickup cars
    // This would typically query the database for cars scheduled for pickup
    const mockData = {
        cars: [
            {
                id: "car1",
                licensePlate: "ABC123",
                model: "Toyota Camry",
                pickupTime: "2024-01-15T10:00:00Z",
                customerName: "John Doe",
                status: "ready_for_pickup"
            }
        ],
        total: 1
    };
    res.status(200).json(new apiResponse_1.ApiResponse(200, mockData, "Pickup cars retrieved successfully"));
});
// Get cars coming for dropoff at PIC's parking lot
exports.getDropoffCars = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    // TODO: Implement actual logic to fetch dropoff cars
    // This would typically query the database for cars scheduled for dropoff
    const mockData = {
        cars: [
            {
                id: "car2",
                licensePlate: "XYZ789",
                model: "Honda Civic",
                dropoffTime: "2024-01-15T16:00:00Z",
                customerName: "Jane Smith",
                status: "scheduled_for_dropoff"
            }
        ],
        total: 1
    };
    res.status(200).json(new apiResponse_1.ApiResponse(200, mockData, "Dropoff cars retrieved successfully"));
});
//# sourceMappingURL=piccontroller.js.map