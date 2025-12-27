import Order from "../models/order.model.js";

export const createOrder = (orderData) => {
  return Order.create(orderData);
};

export const findOrderByOrderId = (orderId) => {
  return Order.findOne({ orderId })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};

export const getOrderTransations = (pipeline,skip,limit) => {
  return Order.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]);
};

export const getOrderTransationsTotal=(pipeline)=>{
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
}

export const findUserOrders = (query) => {
  return Order.find(query)
    .sort({ createdAt: -1 })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};

export const findOrderById = (orderId) => {
  return Order.findById(orderId);
};


export const saveOrder = (order) => {
  return order.save();
};

export const findOrderByIdWithItems = (orderId) => {
  return Order.findById(orderId)
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};

export const findOrderByOrderIdWithUser = (orderId) => {
  return Order.findOne({ orderId })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId")
    .populate("userId");
};

export const findOrderByOrderIdWithDeliveredItems = (orderId) => {
  return Order.aggregate([
    // 1️⃣ Match order
    {
      $match: { orderId },
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

    // 8️⃣ Cleanup
    {
      $project: {
        products: 0,
        variants: 0,
      },
    },
  ]);
};




export const findOrders = (query, sort = {}) => {
  return Order.find(query).sort(sort).populate("userId", "username email");
};

export const countAllOrders = () => Order.countDocuments();

// ANALYTICS
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

export const countActiveOrders = () => {
  return Order.countDocuments({
    orderStatus: { $nin: ["Cancelled", "Returned"] },
  });
};

export const countReturnedOrders = () =>
  Order.countDocuments({ orderStatus: "Returned" });

export const countCancelledOrders = () =>
  Order.countDocuments({ orderStatus: "Cancelled" });

export const findOrderDetailsById = (id) => {
  return Order.findById(id)
    .populate("userId")
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};
