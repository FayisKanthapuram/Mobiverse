import { completeReferralReward } from "../../../referral/referral.service.js";
import { findOrderById, saveOrder } from "../../repo/order.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { calculateOrderStatus } from "../../order.helper.js";

export const updateItemStatusService = async (orderId, itemId, newStatus) => {
  const order = await findOrderById(orderId);

  if (!order) {
    throw new AppError("Order not found", HttpStatus.NOT_FOUND);
  }

  const item = order.orderedItems.id(itemId);
  console.log(order.orderedItems)
  if (!item) {
    throw new AppError("Item not found", HttpStatus.NOT_FOUND);
  }

  // ❌ Prevent invalid updates
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

  // ❌ Prevent backward flow
  if (statusFlow.indexOf(newStatus) < statusFlow.indexOf(item.itemStatus)) {
    throw new AppError(
      "Item status rollback is not allowed",
      HttpStatus.BAD_REQUEST
    );
  }

  const now = new Date();

  // ✅ Update item status + timeline
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

  // ✅ Delivered case (ITEM level)
  if (newStatus === "Delivered") {
    // if all items delivered → order delivered
    const allDelivered = order.orderedItems.every(
      (i) => i.itemStatus === "Delivered"
    );

    if (allDelivered) {
      order.orderStatus = "Delivered";
      order.deliveredDate = now;
      order.paymentStatus = "Paid";

      await completeReferralReward(order.userId, order._id);
    } else {
      order.orderStatus = "Partially Delivered";
    }
  }

  // 🔁 Recalculate order status (generic)
  order.orderStatus = calculateOrderStatus(order.orderedItems);

  order.markModified("orderedItems");
  await saveOrder(order);

  return order;
};
