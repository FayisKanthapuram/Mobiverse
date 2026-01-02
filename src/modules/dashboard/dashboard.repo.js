import Order from "../order/models/order.model.js";
import User from "../user/user.model.js";
import Product from "../product/models/product.model.js";

// Dashboard repository - DB aggregations for dashboard metrics
/* --------------------------------
  DASHBOARD STATS
---------------------------------*/
export const getDashboardStatsRepo = async () => {
  const revenueAgg = await Order.aggregate([
    // 🔹 Flatten items
    { $unwind: "$orderedItems" },

    // 🔹 Only revenue-valid items
    {
      $match: {
        "orderedItems.itemStatus": {
          $in: ["Delivered", "ReturnRequested", "ReturnRejected"],
        },
      },
    },

    // 🔹 Calculate net revenue
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $multiply: [
              {
                $max: [
                  {
                    $subtract: [
                      "$orderedItems.price",
                      {
                        $add: [
                          { $ifNull: ["$orderedItems.couponShare", 0] },
                          { $ifNull: ["$orderedItems.offer", 0] },
                        ],
                      },
                    ],
                  },
                  0, // prevent negative revenue
                ],
              },
              "$orderedItems.quantity",
            ],
          },
        },
      },
    },
  ]);

  return {
    revenue: revenueAgg[0]?.total || 0,

    // These remain order-level
    orders: await Order.countDocuments(),
    users: await User.countDocuments({ isBlocked: false }),
    products: await Product.countDocuments({ isListed: true }),
  };
};


/* --------------------------------
   SALES CHART
---------------------------------*/
export const getSalesChartRepo = async (startDate, groupFormat) => {
  return Order.aggregate([
    {
      $match: {
        deliveredDate: { $gte: startDate },
      },
    },

    // 🔹 Flatten ordered items
    { $unwind: "$orderedItems" },

    // 🔹 Include only revenue-valid item statuses
    {
      $match: {
        "orderedItems.itemStatus": {
          $in: ["Delivered", "ReturnRequested", "ReturnRejected"],
        },
      },
    },

    // 🔹 Group & calculate NET revenue
    {
      $group: {
        _id: groupFormat,
        revenue: {
          $sum: {
            $multiply: [
              {
                $max: [
                  {
                    $subtract: [
                      "$orderedItems.price",
                      {
                        $add: [
                          { $ifNull: ["$orderedItems.couponShare", 0] },
                          { $ifNull: ["$orderedItems.offer", 0] },
                        ],
                      },
                    ],
                  },
                  0, // ⛔ prevent negative revenue
                ],
              },
              "$orderedItems.quantity",
            ],
          },
        },
      },
    },

    { $sort: { _id: 1 } },
  ]);
};


/* --------------------------------
   ORDER STATUS
---------------------------------*/
export const getOrderStatusRepo = async () => {
  return Order.aggregate([
    { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
  ]);
};

/* --------------------------------
   TOP PRODUCTS
---------------------------------*/
export const getTopProductsRepo = async () => {
  return Order.aggregate([
    { $unwind: "$orderedItems" },
    {
      $group: {
        _id: "$orderedItems.productId",
        sales: { $sum: "$orderedItems.quantity" },
        revenue: {
          $sum: {
            $multiply: ["$orderedItems.price", "$orderedItems.quantity"],
          },
        },
      },
    },
    { $sort: { sales: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  ]);
};

/* --------------------------------
   TOP BRANDS
---------------------------------*/
export const getTopBrandsRepo = async () => {
  return Order.aggregate([
    { $unwind: "$orderedItems" },
    {
      $lookup: {
        from: "products",
        localField: "orderedItems.productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $group: {
        _id: "$product.brandID",
        sales: { $sum: "$orderedItems.quantity" },
        revenue: {
          $sum: {
            $multiply: ["$orderedItems.price", "$orderedItems.quantity"],
          },
        },
      },
    },
    { $sort: { sales: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "_id",
        as: "brand",
      },
    },
    { $unwind: "$brand" },
  ]);
};

/* --------------------------------
   RECENT ORDERS
---------------------------------*/
export const getRecentOrdersRepo = async () => {
  return Order.find()
    .populate("userId", "username")
    .sort({ createdAt: -1 })
    .limit(5)
    .select("orderId userId finalAmount orderStatus");
};
