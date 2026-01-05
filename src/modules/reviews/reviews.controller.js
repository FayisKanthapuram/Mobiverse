import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";
import { createReviewService } from "./reviews.service.js";

export const createReview = async (req, res, next) => {
  const userId = req.user._id;
  const { orderItemId, productId, variantId, rating, comment } = req.body;

  if (!orderItemId || !productId || !variantId || !rating) {
    throw new AppError(
      "Required review fields are missing",
      HttpStatus.BAD_REQUEST
    );
  }

  await createReviewService({
    userId,
    orderItemId,
    productId,
    variantId,
    rating,
    comment,
  });

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: "Review submitted successfully",
  });
};
