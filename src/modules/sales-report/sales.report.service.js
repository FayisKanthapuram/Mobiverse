import {
  getOrderTransations,
  getOrderTransationsTotal,
} from "../order/repo/order.repo.js";
import { AppError } from "../../shared/utils/app.error.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";

export const getDeliveredSalesReportService = async ({
  reportType,
  startDate,
  endDate,
  page,
  limit,
}) => {
  // Build date filter based on report type
  let dateFilter = {};
  const now = new Date();

  if (reportType === "daily") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: today } };
  }

  if (reportType === "weekly") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: weekAgo } };
  }

  if (reportType === "monthly") {
    const monthAgo = new Date();
    monthAgo.setMonth(now.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: monthAgo } };
  }

  if (reportType === "yearly") {
    const yearAgo = new Date();
    yearAgo.setFullYear(now.getFullYear() - 1);
    yearAgo.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: yearAgo } };
  }

  if (reportType === "custom") {
    if (!startDate || !endDate) {
      throw new AppError(
        "Start date and end date are required",
        HttpStatus.BAD_REQUEST
      );
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    dateFilter = { createdAt: { $gte: start, $lte: end } };
  }

  const skip = (page - 1) * limit;

  // Build aggregation pipeline for sales data
  const basePipeline = [
    { $match: dateFilter },

    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    { $unwind: "$orderedItems" },

    {
      $match: {
        "orderedItems.itemStatus": {
          $in: ["Delivered", "ReturnRejected", "ReturnRequested"],
        },
      },
    },

    {
      $addFields: {
        itemGrossTotal: {
          $multiply: [
            {
              $cond: [
                { $gt: ["$orderedItems.regularPrice", 0] },
                "$orderedItems.regularPrice",
                "$orderedItems.price",
              ],
            },
            "$orderedItems.quantity",
          ],
        },
        itemDiscountTotal: {
          $multiply: [
            {
              $add: [
                "$orderedItems.offer",
                "$orderedItems.couponShare",
                {
                  $subtract: [
                    "$orderedItems.regularPrice",
                    "$orderedItems.price",
                  ],
                },
              ],
            },
            "$orderedItems.quantity",
          ],
        },
      },
    },

    {
      $addFields: {
        itemNetTotal: {
          $subtract: ["$itemGrossTotal", "$itemDiscountTotal"],
        },
      },
    },

    {
      $group: {
        _id: "$_id",
        orderId: { $first: "$orderId" },
        createdAt: { $first: "$createdAt" },
        customerName: { $first: "$user.username" },
        customerEmail: { $first: "$user.email" },
        paymentMethod: { $first: "$paymentMethod" },
        itemCount: { $sum: "$orderedItems.quantity" },
        totalAmount: { $sum: "$itemNetTotal" },
        discount: { $sum: "$itemDiscountTotal" },
      },
    },

    { $sort: { createdAt: -1 } },
  ];

  const transactions = await getOrderTransations(basePipeline, skip, limit);
  const totalsAgg = await getOrderTransationsTotal(basePipeline);
  const totals = totalsAgg[0] || {};

  const totalTransactions = totals.totalOrders || 0;

  return {
    salesData: {
      transactions,
      totalSales: totals.totalSales || 0,
      totalOrders: totals.totalOrders || 0,
      totalDiscounts: totals.totalDiscounts || 0,
      productsSold: totals.productsSold || 0,
      averageOrderValue:
        totals.totalOrders > 0 ? totals.totalSales / totals.totalOrders : 0,
    },
    totalTransactions,
    totalPages: Math.ceil(totalTransactions / limit),
    currentPage: page,
    limit,
  };
};
