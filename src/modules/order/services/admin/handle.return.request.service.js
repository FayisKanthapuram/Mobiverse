import { findOrderById, saveOrder } from "../../repo/order.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { OrderMessages } from "../../../../shared/constants/messages/orderMessages.js";
import { calculateOrderStatus } from "../../order.helper.js";

// Handle return request service - process return requests
// Approve or reject return request for an item
export const handleReturnRequestService = async (orderId, body) => {
  const { itemId, action, adminNote } = body;


  if (!itemId || !action) {
    throw new AppError(OrderMessages.MISSING_ITEM_OR_ACTION, HttpStatus.BAD_REQUEST);
  }

  if (!["approve", "reject"].includes(action)) {
    throw new AppError(OrderMessages.INVALID_ACTION, HttpStatus.BAD_REQUEST);
  }

  const order = await findOrderById(orderId);
  if (!order) {
    throw new AppError(OrderMessages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const item =
    order.orderedItems.id?.(itemId) ||
    order.orderedItems.find((i) => i._id.toString() === itemId);

  if (!item) {
    throw new AppError(OrderMessages.ORDERED_ITEM_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (["Cancelled", "Returned"].includes(item.itemStatus)) {
    throw new AppError(
      OrderMessages.CANNOT_CHANGE_RETURN_STATUS,
      HttpStatus.BAD_REQUEST
    );
  }

  const now = new Date();

  if (!item.itemTimeline) item.itemTimeline = {};

  if (action === "approve") {
    item.itemStatus = "ReturnApproved";
    item.itemTimeline.returnApprovedAt = now;
  } else {
    item.itemStatus = "ReturnRejected";
    item.itemTimeline.returnRejectedAt = now;
  }

  if (adminNote) item.adminNote = adminNote;

  order.orderStatus = calculateOrderStatus(order.orderedItems);

  order.markModified("orderedItems");
  await saveOrder(order);

  return order;
};
