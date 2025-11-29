import Order from "../models/orderModel.js";

export const createOrder = (orderData) => {
  return Order.create(orderData);
};
