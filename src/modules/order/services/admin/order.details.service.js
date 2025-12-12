import { findOrderDetailsById } from "../../repo/order.repo.js";

export const loadOrderDetailsService = async (orderId) => {
  const order = await findOrderDetailsById(orderId);

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  return order;
};
