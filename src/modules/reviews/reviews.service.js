import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

import {
  findReviewByOrderItemId,
  createReviewRepo,
  findOrderByUserAndItem,
  markOrderItemReviewed,
} from "./reviews.repo.js";

export const createReviewService = async ({
  userId,
  orderItemId,
  productId,
  variantId,
  rating,
  comment,
}) => {
  // 1️⃣ Prevent duplicate review
  const existingReview = await findReviewByOrderItemId(orderItemId);

  if (existingReview) {
    throw new AppError(
      "You have already reviewed this item",
      HttpStatus.CONFLICT
    );
  }

  // 2️⃣ Get order + item validation
  const order = await findOrderByUserAndItem(userId, orderItemId);

  if (!order) {
    throw new AppError("Order item not found", HttpStatus.NOT_FOUND);
  }

  const orderedItem = order.orderedItems.id(orderItemId);

  // 3️⃣ Only delivered items allowed
  if (orderedItem.itemStatus !== "Delivered") {
    throw new AppError(
      "Only delivered items can be reviewed",
      HttpStatus.BAD_REQUEST
    );
  }

  // 4️⃣ Create review
  await createReviewRepo({
    userId,
    productId,
    variantId,
    orderItemId,
    rating,
    comment,
  });

  // 5️⃣ Update order item
  await markOrderItemReviewed(order, orderItemId);
};
