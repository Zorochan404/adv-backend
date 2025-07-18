import { eq, and } from "drizzle-orm";
import { db } from "../../drizzle/db";
import { asyncHandler } from "../utils/asyncHandler";
import { reviewModel } from "./reviewmodel";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";

export const addreview = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { rating, comment } = req.body;
        const { carid } = req.params;
        const userid = (req as any).user?.id;
        

        
        if (!userid) {
            return res.status(401).json(new ApiResponse(401, null, "User not authenticated"));
        }
        
        // Validate rating range (assuming 1-5 scale)
        if (rating < 1 || rating > 5) {
            return res.status(400).json(new ApiResponse(400, null, "Rating must be between 1 and 5"));
        }
        
        // Check if user has already reviewed this car
        const existingReview = await db
            .select()
            .from(reviewModel)
            .where(and(
                eq(reviewModel.carid, parseInt(carid)),
                eq(reviewModel.userid, userid)
            ));
        
        if (existingReview.length > 0) {
           return res.status(400).json(new ApiResponse(400, null, "You have already reviewed this car"));
        }
        
        // Add the review
        const review = await db
            .insert(reviewModel)
            .values({
                carid: parseInt(carid),
                userid,
                rating,
                comment,
            })
            .returning();
        
        return res.status(200).json(new ApiResponse(200, review[0], "Review added successfully"));
    } catch (error) {
        console.log(error);
        if (error instanceof ApiError) {
            throw error;
        }
        return res.status(500).json(new ApiResponse(500, null, "Failed to add review"));
    }
});


export const getavgratingbycars = asyncHandler (async (req: Request, res: Response) => {
    try {
        const { carid } = req.params;
        const reviews = await db.select().from(reviewModel).where(eq(reviewModel.carid, parseInt(carid)));
        // Safely handle possible null ratings
        const validRatings = reviews
            .map((review) => review.rating)
            .filter((rating): rating is number => rating !== null && rating !== undefined);
        const avgRating = validRatings.length > 0
            ? validRatings.reduce((acc, rating) => acc + rating, 0) / validRatings.length
            : 0;
        res.status(200).json({ review: avgRating });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to get reviews"));
    }
});

export const getreviewsbycars = asyncHandler (async (req: Request, res: Response) => {
    try {
        const { carid } = req.params;
        const reviews = await db.select().from(reviewModel).where(eq(reviewModel.carid, parseInt(carid)));
        res.status(200).json({ reviews });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to get reviews"));
    }
});


export const getreviews = asyncHandler (async (req: Request, res: Response) => {
    try {
        const reviews = await db.select().from(reviewModel);
        res.status(200).json({ reviews });
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to get reviews"));
    }
});


export const updatereview = asyncHandler (async (req: Request, res: Response) => {
    try {
        const { reviewid } = req.params;
        const currentUser = (req as any).user;
        
        if (!currentUser) {
            return res.status(401).json(new ApiResponse(401, null, "User not authenticated"));
        }
        const singlereview = await db.select().from(reviewModel).where(eq(reviewModel.id, parseInt(reviewid)));

        if (singlereview.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Review not found"));
        }
        const reviewToUpdate = singlereview[0];
        
        const { rating, comment } = req.body;
        if(currentUser.role === "admin" || currentUser.id === reviewToUpdate.userid){
            const review = await db.update(reviewModel).set({ rating, comment }).where(eq(reviewModel.id, parseInt(reviewid)));
            res.status(200).json({ message: "Review updated successfully", review });
        }else{
            return res.status(401).json(new ApiResponse(401, null, "You are not authorized to update this review"));
        }
    } catch (error) {
        return res.status(500).json(new ApiResponse(500, null, "Failed to update review"));
    }
});


export const deletereview = asyncHandler(async (req: Request, res: Response) => {
    try {
        const { reviewid } = req.params;
        const currentUser = (req as any).user;
        
        if (!currentUser) {
            return res.status(401).json(new ApiResponse(401, null, "User not authenticated"));
        }
        
        // Get the review to check ownership
        const singlereview = await db.select().from(reviewModel).where(eq(reviewModel.id, parseInt(reviewid)));
        
        if (singlereview.length === 0) {
            return res.status(404).json(new ApiResponse(404, null, "Review not found"));
        }
        
        const reviewToDelete = singlereview[0];
        
        // Check if user can delete the review (admin or review owner)
        if (currentUser.role === "admin" || currentUser.id === reviewToDelete.userid) {
            const review = await db.delete(reviewModel).where(eq(reviewModel.id, parseInt(reviewid)));
            return res.status(200).json(new ApiResponse(200, review, "Review deleted successfully"));
        } else {
            return res.status(403).json(new ApiResponse(403, null, "You are not authorized to delete this review"));
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to delete review"));
    }
});