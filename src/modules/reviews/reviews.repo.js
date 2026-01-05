import mongoose from "mongoose";
import Review from "./review.model.js";
import Order from "../order/models/order.model.js";

/**
 * Check if review already exists for an order item
 */
export const findReviewByOrderItemId = (orderItemId) => {
  return Review.findOne({
    orderItemId: new mongoose.Types.ObjectId(orderItemId),
  });
};

/**
 * Create a new review
 */
export const createReviewRepo = ({
  userId,
  productId,
  variantId,
  orderItemId,
  rating,
  comment,
}) => {
  return Review.create({
    userId,
    productId,
    variantId,
    orderItemId,
    rating,
    comment,
  });
};

/**
 * Find order by user + orderItemId
 */
export const findOrderByUserAndItem = (userId, orderItemId) => {
  return Order.findOne({
    userId: new mongoose.Types.ObjectId(userId),
    "orderedItems._id": new mongoose.Types.ObjectId(orderItemId),
  });
};

/**
 * Mark ordered item as reviewed
 */
export const markOrderItemReviewed = async (order, orderItemId) => {
  const item = order.orderedItems.id(orderItemId);
  if (!item) return;

  item.isReviewed = true;
  await order.save();
};

/**
 * Get reviews for a product (latest first)
 */
export const findReviewsByProductId = (productId, limit = 10) => {
  return Review.find({
    productId: new mongoose.Types.ObjectId(productId),
  })
    .populate("userId", "name") // assuming User has `name`
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get rating summary for a product
 */
export const getProductRatingSummary = async (productId) => {
  const result = await Review.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
      },
    },
    {
      $group: {
        _id: "$productId",
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  return result[0] || { avgRating: 0 };
};
