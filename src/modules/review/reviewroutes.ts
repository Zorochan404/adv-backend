import { Router } from "express";
import { addreview, getavgratingbycars, getreviewsbycars, getreviews, updatereview, deletereview } from "./reviewcontroller";
import { verifyJWT } from "../middleware/auth";

const reviewRouter = Router();

reviewRouter.post("/addreview/:carid", verifyJWT, addreview);
reviewRouter.get("/getavgratingbycars/:carid", getavgratingbycars);
reviewRouter.get("/getreviewsbycars/:carid", getreviewsbycars);
reviewRouter.get("/getreviews", getreviews);
reviewRouter.put("/updatereview/:reviewid", verifyJWT, updatereview);
reviewRouter.delete("/deletereview/:reviewid", verifyJWT, deletereview);
export default reviewRouter;    