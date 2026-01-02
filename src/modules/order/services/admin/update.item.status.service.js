import { completeReferralReward } from "../../../referral/referral.service.js";
import { findOrderById, saveOrder } from "../../repo/order.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import {
  calculateOrderPaymentStatus,
  calculateOrderStatus,
} from "../../order.helper.js";

// Update item status service - modify order item status
// Update status of an ordered item
export const updateItemStatusService = async (orderId, itemId, newStatus) => {
  const order = await findOrderById(orderId);

  if (!order) {
    throw new AppError("Order not found", HttpStatus.NOT_FOUND);
  }

  const item = order.orderedItems.id(itemId);
  if (!item) {
    throw new AppError("Item not found", HttpStatus.NOT_FOUND);
  }

  // Validate item is not in final states
  if (
    [
      "Cancelled",
      "Returned",
      "ReturnApproved",
      "ReturnRequested",
      "Delivered",
    ].includes(item.itemStatus)
  ) {
    throw new AppError("Item status cannot be updated", HttpStatus.BAD_REQUEST);
  }

  const statusFlow = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  if (!statusFlow.includes(newStatus)) {
    throw new AppError("Invalid item status", HttpStatus.BAD_REQUEST);
  }

  // Prevent status rollback
  if (statusFlow.indexOf(newStatus) < statusFlow.indexOf(item.itemStatus)) {
    throw new AppError(
      "Item status rollback is not allowed",
      HttpStatus.BAD_REQUEST
    );
  }

  const now = new Date();

  // Update item status and timeline
  item.itemStatus = newStatus;
  item.itemTimeline ||= {};

  const timelineMap = {
    Confirmed: "confirmedAt",
    Processing: "processedAt",
    Shipped: "shippedAt",
    "Out for Delivery": "outForDeliveryAt",
    Delivered: "deliveredAt",
  };

  const timeKey = timelineMap[newStatus];
  if (timeKey && !item.itemTimeline[timeKey]) {
    item.itemTimeline[timeKey] = now;
  }

  if (newStatus === "Delivered") {
    order.deliveredDate = now;
  }
  // Mark COD as paid when delivered
  if (newStatus === "Delivered"&&order.paymentMethod==='cod') {
    item.paymentStatus = "Paid";
    const allDelivered = order.orderedItems.every(
      (i) => i.itemStatus === "Delivered"
    );

    if (allDelivered) {
      await completeReferralReward(order.userId, order._id);
    }
  }

  // Recalculate order status based on items
  order.orderStatus = calculateOrderStatus(order.orderedItems);
  order.paymentStatus = calculateOrderPaymentStatus(order.orderedItems);

  order.markModified("orderedItems");
  await saveOrder(order);

  return order;
};
