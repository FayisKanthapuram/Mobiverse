import Order from "./order.model.js";

export const createOrder = (orderData) => {
  return Order.create(orderData);
};

export const findOrderByOrderId = (orderId) => {
  return Order.findOne({ orderId })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
};

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

export const findOrders = (query, sort = {}) => {
  return Order.find(query)
    .sort(sort)
    .populate("userId", "username email");
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