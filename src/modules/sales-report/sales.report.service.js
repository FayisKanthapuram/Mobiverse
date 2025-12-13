import {
  getOrderTransations,
  getOrderTransationsTotal,
} from "../order/repo/order.repo.js";

export const getDeliveredSalesReportService = async ({
  reportType,
  startDate,
  endDate,
  page,
  limit,
}) => {
  
  // ---------------- DATE FILTER ----------------
  let dateFilter = {};
  const today = new Date();
  console.log()
  if (reportType === "daily") {
    today.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: today } };
  }

  if (reportType === "weekly") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: weekAgo } };
  }

  if (reportType === "monthly") {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: monthAgo } };
  }

  if (reportType === "yearly") {
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    yearAgo.setHours(0, 0, 0, 0);
    dateFilter = { createdAt: { $gte: yearAgo } };
  }

  if (reportType === "custom" && startDate && endDate) {
    dateFilter = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };
  }

  const skip = (page - 1) * limit;

  // ---------------- AGGREGATION ----------------
  const basePipeline = [
    { $match: dateFilter },

    // Join user
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    // Flatten items
    { $unwind: "$orderedItems" },

    // 🔥 ONLY DELIVERED ITEMS
    {
      $match: {
        "orderedItems.itemStatus": {
          $in: ["Delivered", "ReturnRejected"],
        },
      },
    },

    // ---------------- CALCULATIONS PER ITEM ----------------
    {
      $addFields: {
        itemGrossTotal: {
          $multiply: [
            {
              $cond: {
                if: { $ne: ["$orderedItems.regularPrice", 0] }, // if regularPrice != 0
                then: "$orderedItems.regularPrice", // use regularPrice
                else: "$orderedItems.price", // else use price
              },
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

    // ---------------- GROUP BY ORDER ----------------
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
  const totalPages = Math.ceil(totalTransactions / limit);

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
    totalPages,
    currentPage: page,
    limit,
  };
};
