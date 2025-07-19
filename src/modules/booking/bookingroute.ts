import { Router } from "express";
import { createBooking, getBookings, getbookingbypickupParkingId, getbookingbydropoffParkingId, getbookingbyid, getbookingbystatus, getbookingbyuserid, getbookingbycarid } from "./bookingcontroller";
import { verifyJWT } from "../middleware/auth";

const router = Router();

router.post("/add", verifyJWT, createBooking);
router.get("/get", getBookings);
router.get("/b/:id", getbookingbyid);
router.get("/bs", getbookingbystatus);
router.get("/bu/:id", getbookingbyuserid);
router.get("/bc/:id", getbookingbycarid);


//admin
router.get("/ppi/:id", verifyJWT, getbookingbypickupParkingId);
router.get("/dpi/:id", verifyJWT, getbookingbydropoffParkingId);

export default router;