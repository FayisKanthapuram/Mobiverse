import Order from "../models/order.model.js";

// Order repository - data access layer for orders
// Create new order
export const createOrder = (orderData) => {
  return Order.create(orderData);
};

// Find order by order ID with populated items
export const findOrderByOrderId = (orderId, userId) => {
  return Order.findOne({ orderId, userId })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};

// Get aggregated order transactions with pagination
export const getOrderTransations = (pipeline, skip, limit) => {
  return Order.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]);
};

export const getOrderTransationsTotal = (pipeline) => {
  return Order.aggregate([
    ...pipeline,
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalAmount" }, // NET SALES
        totalOrders: { $sum: 1 },
        totalDiscounts: { $sum: "$discount" },
        productsSold: { $sum: "$itemCount" },
      },
    },
  ]);
};

// Find all orders for a user
export const findUserOrders = (query) => {
  return Order.find(query)
    .sort({ createdAt: -1 })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};

// Find order by MongoDB ID
export const findOrderById = (orderId) => {
  return Order.findById(orderId);
};

export const saveOrder = (order) => {
  return order.save();
};

// Find order with populated items
export const findOrderByIdWithItems = (orderId) => {
  return Order.findById(orderId)
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};

// Find order with user information
export const findOrderByOrderIdWithUser = (orderId, userId) => {
  return Order.findOne({ orderId, userId })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId")
    .populate("userId");
};

// Find order with delivered items aggregated pipeline
export const findOrderByOrderIdWithDeliveredItems = (orderId, userId) => {
  return Order.aggregate([
    // 1️⃣ Match order
    {
      $match: { orderId, userId },
    },

    // 2️⃣ Keep only Delivered / ReturnRequested / ReturnRejected items
    {
      $addFields: {
        orderedItems: {
          $filter: {
            input: "$orderedItems",
            as: "item",
            cond: {
              $in: [
                "$$item.itemStatus",
                ["Delivered", "ReturnRejected", "ReturnRequested"],
              ],
            },
          },
        },
      },
    },

    // 3️⃣ Ensure at least one matching item exists
    {
      $match: {
        "orderedItems.0": { $exists: true },
      },
    },

    // 4️⃣ Lookup products
    {
      $lookup: {
        from: "products",
        localField: "orderedItems.productId",
        foreignField: "_id",
        as: "products",
      },
    },

    // 5️⃣ Lookup variants
    {
      $lookup: {
        from: "variants",
        localField: "orderedItems.variantId",
        foreignField: "_id",
        as: "variants",
      },
    },

    // 6️⃣ Lookup user
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "userId",
      },
    },
    {
      $unwind: "$userId",
    },

    // 7️⃣ Attach product + variant into each orderedItem
    {
      $addFields: {
        orderedItems: {
          $map: {
            input: "$orderedItems",
            as: "item",
            in: {
              $mergeObjects: [
                "$$item",
                {
                  productId: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$products",
                          as: "p",
                          cond: { $eq: ["$$p._id", "$$item.productId"] },
                        },
                      },
                      0,
                    ],
                  },
                  variantId: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$variants",
                          as: "v",
                          cond: { $eq: ["$$v._id", "$$item.variantId"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },

    // Cleanup aggregation
    {
      $project: {
        products: 0,
        variants: 0,
      },
    },
  ]);
};

// Find orders with user population
export const findOrders = (query, sort = {}) => {
  return Order.find(query).sort(sort).populate("userId", "username email");
};

export const countAllOrders = () => Order.countDocuments();

// Get total revenue from valid orders
export const getTotalRevenue = () => {
  return Order.aggregate([
    {
      $match: {
        orderStatus: { $nin: ["Cancelled", "Returned"] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$finalAmount" },
      },
    },
  ]);
};

// Count active orders (not cancelled or returned)
export const countActiveOrders = () => {
  return Order.countDocuments({
    orderStatus: { $nin: ["Cancelled", "Returned"] },
  });
};

// Count returned orders
export const countReturnedOrders = () =>
  Order.countDocuments({ orderStatus: "Returned" });

// Count cancelled orders
export const countCancelledOrders = () =>
  Order.countDocuments({ orderStatus: "Cancelled" });

export const findOrderDetailsById = (id) => {
  return Order.findById(id)
    .populate("userId")
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};
