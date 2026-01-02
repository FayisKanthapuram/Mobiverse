import { findOrderByOrderIdWithUser } from "../../repo/order.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { OrderMessages } from "../../../../shared/constants/messages/orderMessages.js";

// Order details service - fetch order details
// Load order details by ID
export const loadOrderDetailsService = async (orderId) => {
  const order = await findOrderByOrderIdWithUser(orderId);
  if (!order) {
    throw new AppError(OrderMessages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }
  return order;
};
