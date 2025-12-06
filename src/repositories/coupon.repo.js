import mongoose from "mongoose";
import Coupon from "../models/couponModel.js";
import couponUsage from "../models/couponUsageModel.js";

export const findCoupons = (query, sortOption, skip, limit) => {
  return Coupon.find(query)
    .populate("specificUsers", "username email")
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));
};

export const countCoupon = (query = {}) => {
  return Coupon.countDocuments(query);
};

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

export const findCouponByCode = (code) => {
  return Coupon.findOne({ code });
};

export const createCoupon = (data) => {
  return Coupon.create(data);
};

export const findAndUpdateCoupon = (id, data) => {
  return Coupon.findByIdAndUpdate(id, data, { new: true });
};

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

export const findCouponById = (id) => {
  return Coupon.findById(id);
};

export const toggleCouponStatus = async (id) => {
  const coupon = await Coupon.findById(id);
  if (!coupon) return null;

  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
};

export const deleteCoupon = (id) => {
  return Coupon.deleteOne({ _id: id });
};
