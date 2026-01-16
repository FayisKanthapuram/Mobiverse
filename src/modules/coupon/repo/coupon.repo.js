import mongoose from "mongoose";
import Coupon from "../models/coupon.model.js";
import couponUsage from "../models/coupon.usage.model.js";

// Coupon repository - DB operations for coupons and usage

// Find coupons with pagination and populate specific users
export const findCoupons = (query, sortOption, skip, limit) => {
  return Coupon.find(query)
    .populate("specificUsers", "username email")
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));
};

// Count coupons matching query
export const countCoupon = (query = {}) => {
  return Coupon.countDocuments(query);
};

// Total coupon usage sum across coupons
export const getTotalCouponUsage = async () => {
  const result = await Coupon.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$currentUsageCount" },
      },
    },
  ]);

  return result[0]?.total || 0;
};

// Sum of discountAmount from coupon usage records
export const getTotalDiscountGiven = async () => {
  const result = await couponUsage.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$discountAmount" },
      },
    },
  ]);

  return result[0]?.total || 0;
};

// Find coupon by code
export const findCouponByCode = (code) => {
  return Coupon.findOne({ code });
};

// Create a coupon
export const createCoupon = (data) => {
  return Coupon.create(data);
};

// Find and update coupon
export const findAndUpdateCoupon = (id, data) => {
  return Coupon.findByIdAndUpdate(id, data, { new: true });
};

// Get available coupons for user at given time
export const getAvailableCoupon = (userId, now) => {
  return Coupon.aggregate([
    {
      $match: {
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
    },
    {
      $match: {
        $expr: {
          $or: [
            { $eq: ["$totalUsageLimit", 0] }, // unlimited total usage
            { $lt: ["$currentUsageCount", "$totalUsageLimit"] }, // still available
          ],
        },
      },
    },
    {
      $match: {
        $or: [
          { userEligibility: "all" }, // all users
          { userEligibility: "new_users" }, // filter outside logic
          {
            $and: [
              { userEligibility: "specific" },
              { specificUsers: new mongoose.Types.ObjectId(userId) },
            ],
          },
        ],
      },
    },
  ]);
};

// Find coupon by id
export const findCouponById = (id) => {
  return Coupon.findById(id);
};

// Toggle coupon active flag
export const toggleCouponStatus = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) return null;

  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
};

// Delete coupon by id
export const deleteCoupon = (id) => {
  return Coupon.deleteOne({ _id: id });
};

// Increment coupon usage count safely
export const findCouponIncrementCount = (_id, session = null) => {
  const options = {
    new: true,
    session,
  };

  return Coupon.findOneAndUpdate(
    {
      _id,
      totalUsageLimit: { $ne: 0 },
      $expr: {
        $lt: ["$currentUsageCount", "$totalUsageLimit"],
      },
    },
    {
      $inc: { currentUsageCount: 1 },
    },
    options
  );
};
