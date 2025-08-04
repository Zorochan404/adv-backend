import { eq, and } from "drizzle-orm";
import { db } from "../../drizzle/db";
import { asyncHandler } from "../utils/asyncHandler";
import { reviewModel } from "./reviewmodel";
import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { ApiResponse } from "../utils/apiResponse";
import { sql } from "drizzle-orm";

export const addreview = asyncHandler(async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body;
    const { carid } = req.params;
    const userid = (req as any).user?.id;

    if (!userid) {
      return res
        .status(401)
        .json(new ApiResponse(401, null, "User not authenticated"));
    }

    // Validate rating range (assuming 1-5 scale)
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Rating must be between 1 and 5"));
    }

    // Check if user has already reviewed this car
    const existingReview = await db
      .select()
      .from(reviewModel)
      .where(
        and(
          eq(reviewModel.carid, parseInt(carid)),
          eq(reviewModel.userid, userid)
        )
      );

    if (existingReview.length > 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "You have already reviewed this car"));
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

    // Get the populated review with user data
    const populatedReview = await db.query.reviewModel.findFirst({
      where: eq(reviewModel.id, review[0].id),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            number: true,
            role: true,
            isverified: true,
            createdAt: true,
          },
        },
      },
    });

    return res
      .status(200)
      .json(new ApiResponse(200, populatedReview, "Review added successfully"));
  } catch (error) {
    console.log(error);
    if (error instanceof ApiError) {
      throw error;
    }
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to add review"));
  }
});

export const getavgratingbycars = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { carid } = req.params;
      const reviews = await db
        .select()
        .from(reviewModel)
        .where(eq(reviewModel.carid, parseInt(carid)));
      // Safely handle possible null ratings
      const validRatings = reviews
        .map((review) => review.rating)
        .filter(
          (rating): rating is number => rating !== null && rating !== undefined
        );
      const avgRating =
        validRatings.length > 0
          ? validRatings.reduce((acc, rating) => acc + rating, 0) /
            validRatings.length
          : 0;
      res.status(200).json({ review: avgRating });
    } catch (error) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to get reviews"));
    }
  }
);

export const getreviewsbycars = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { carid } = req.params;
      const {
        limit = 10,
        page = 1,
        sort = "createdAt",
        order = "desc",
      } = req.query;

      // Parse and validate query parameters
      const limitNum = Math.min(parseInt(limit as string) || 10, 50); // Max 50 reviews per request
      const pageNum = Math.max(parseInt(page as string) || 1, 1);
      const offset = (pageNum - 1) * limitNum;

      // Validate sort field
      const allowedSortFields = ["createdAt", "updatedAt", "rating"];
      const sortField = allowedSortFields.includes(sort as string)
        ? (sort as string)
        : "createdAt";
      const sortOrder = order === "asc" ? "asc" : "desc";

      // Get total count for pagination
      const totalReviews = await db
        .select({ count: sql<number>`count(*)` })
        .from(reviewModel)
        .where(eq(reviewModel.carid, parseInt(carid)));

      const total = totalReviews[0]?.count || 0;

      // Get reviews with populated user and car data
      const reviews = await db.query.reviewModel.findMany({
        where: eq(reviewModel.carid, parseInt(carid)),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              avatar: true,
              email: true,
              number: true,
              role: true,
              isverified: true,
              createdAt: true,
            },
          },
        },
        limit: limitNum,
        offset: offset,
        orderBy: (reviewModel, { asc, desc }) =>
          sortOrder === "asc"
            ? asc(reviewModel[sortField as keyof typeof reviewModel])
            : desc(reviewModel[sortField as keyof typeof reviewModel]),
      });

      // Calculate pagination info
      const totalPages = Math.ceil(total / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      const response = {
        reviews,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalReviews: total,
          limit: limitNum,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNum + 1 : null,
          prevPage: hasPrevPage ? pageNum - 1 : null,
        },
      };

      res
        .status(200)
        .json(new ApiResponse(200, response, "Reviews fetched successfully"));
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to get reviews"));
    }
  }
);

export const getreviews = asyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      limit = 10,
      page = 1,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    // Parse and validate query parameters
    const limitNum = Math.min(parseInt(limit as string) || 10, 50); // Max 50 reviews per request
    const pageNum = Math.max(parseInt(page as string) || 1, 1);
    const offset = (pageNum - 1) * limitNum;

    // Validate sort field
    const allowedSortFields = ["createdAt", "updatedAt", "rating"];
    const sortField = allowedSortFields.includes(sort as string)
      ? (sort as string)
      : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    // Get total count for pagination
    const totalReviews = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewModel);

    const total = totalReviews[0]?.count || 0;

    // Get all reviews with populated user data
    const reviews = await db.query.reviewModel.findMany({
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            number: true,
            role: true,
            isverified: true,
            createdAt: true,
          },
        },
      },
      limit: limitNum,
      offset: offset,
      orderBy: (reviewModel, { asc, desc }) =>
        sortOrder === "asc"
          ? asc(reviewModel[sortField as keyof typeof reviewModel])
          : desc(reviewModel[sortField as keyof typeof reviewModel]),
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const response = {
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalReviews: total,
        limit: limitNum,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNum + 1 : null,
        prevPage: hasPrevPage ? pageNum - 1 : null,
      },
    };

    res
      .status(200)
      .json(new ApiResponse(200, response, "All reviews fetched successfully"));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Failed to get reviews"));
  }
});

export const updatereview = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { reviewid } = req.params;
      const currentUser = (req as any).user;

      if (!currentUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, null, "User not authenticated"));
      }
      const singlereview = await db
        .select()
        .from(reviewModel)
        .where(eq(reviewModel.id, parseInt(reviewid)));

      if (singlereview.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, null, "Review not found"));
      }
      const reviewToUpdate = singlereview[0];

      const { rating, comment } = req.body;
      if (
        currentUser.role === "admin" ||
        currentUser.id === reviewToUpdate.userid
      ) {
        await db
          .update(reviewModel)
          .set({ rating, comment })
          .where(eq(reviewModel.id, parseInt(reviewid)));

        // Get the updated review with populated user data
        const updatedReview = await db.query.reviewModel.findFirst({
          where: eq(reviewModel.id, parseInt(reviewid)),
          with: {
            user: {
              columns: {
                id: true,
                name: true,
                avatar: true,
                email: true,
                number: true,
                role: true,
                isverified: true,
                createdAt: true,
              },
            },
          },
        });

        res
          .status(200)
          .json(
            new ApiResponse(200, updatedReview, "Review updated successfully")
          );
      } else {
        return res
          .status(401)
          .json(
            new ApiResponse(
              401,
              null,
              "You are not authorized to update this review"
            )
          );
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to update review"));
    }
  }
);

export const deletereview = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const { reviewid } = req.params;
      const currentUser = (req as any).user;

      if (!currentUser) {
        return res
          .status(401)
          .json(new ApiResponse(401, null, "User not authenticated"));
      }

      // Get the review to check ownership
      const singlereview = await db
        .select()
        .from(reviewModel)
        .where(eq(reviewModel.id, parseInt(reviewid)));

      if (singlereview.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, null, "Review not found"));
      }

      const reviewToDelete = singlereview[0];

      // Check if user can delete the review (admin or review owner)
      if (
        currentUser.role === "admin" ||
        currentUser.id === reviewToDelete.userid
      ) {
        const review = await db
          .delete(reviewModel)
          .where(eq(reviewModel.id, parseInt(reviewid)));
        return res
          .status(200)
          .json(new ApiResponse(200, review, "Review deleted successfully"));
      } else {
        return res
          .status(403)
          .json(
            new ApiResponse(
              403,
              null,
              "You are not authorized to delete this review"
            )
          );
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Failed to delete review"));
    }
  }
);
