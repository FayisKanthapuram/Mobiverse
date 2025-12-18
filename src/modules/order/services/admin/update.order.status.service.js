import { completeReferralReward } from "../../../referral/referral.service.js";
import { findOrderById, saveOrder } from "../../repo/order.repo.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { OrderMessages } from "../../../../shared/constants/messages/orderMessages.js";

export const updateOrderStatusService = async (orderId, newStatus) => {
  const order = await findOrderById(orderId);

  if (!order) {
    throw new AppError(OrderMessages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const now = new Date();

  /* ----------------------------------------------------
     INITIALIZE TIMELINE
  ---------------------------------------------------- */
  if (!order.statusTimeline) {
    order.statusTimeline = {};
  }

  const timeline = order.statusTimeline;

  const statusFlow = [
    "Pending",
    "Confirmed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  const timelineMap = {
    Confirmed: "confirmedAt",
    Processing: "processedAt",
    Shipped: "shippedAt",
    "Out for Delivery": "outForDeliveryAt",
    Delivered: "deliveredAt",
    Cancelled: "cancelledAt",
    Returned: "returnedAt",
  };

  const validStatuses = [
    ...statusFlow,
    "Cancelled",
    "Returned",
    "Partially Delivered",
    "Partially Cancelled",
    "Partially Returned",
  ];

  if (!validStatuses.includes(newStatus)) {
    throw new AppError(OrderMessages.INVALID_ORDER_STATUS, HttpStatus.BAD_REQUEST);
  }

  /* ----------------------------------------------------
     SPECIAL CASE: CANCELLED
  ---------------------------------------------------- */
  if (newStatus === "Cancelled") {
    timeline.cancelledAt = now;
    order.orderStatus = "Cancelled";

    order.orderedItems.forEach((item) => {
      if (item.itemStatus !== "Cancelled") {
        item.itemStatus = "Cancelled";
        item.itemTimeline ||= {};
        item.itemTimeline.cancelledAt = now;
      }
    });

    await saveOrder(order);
    return order;
  }

  /* ----------------------------------------------------
     SPECIAL CASE: RETURNED
  ---------------------------------------------------- */
  if (newStatus === "Returned") {
    timeline.returnedAt = now;
    order.orderStatus = "Returned";

    order.orderedItems.forEach((item) => {
      if (item.itemStatus !== "Returned") {
        item.itemStatus = "Returned";
        item.itemTimeline ||= {};
        item.itemTimeline.returnedAt = now;
      }
    });

    await saveOrder(order);
    return order;
  }

  /* ----------------------------------------------------
     NORMAL FLOW (AUTO TIMELINE FILL)
  ---------------------------------------------------- */
  const stepIndex = statusFlow.indexOf(newStatus);
  if (stepIndex === -1) {
    throw new AppError(
      OrderMessages.INVALID_SEQUENTIAL_ORDER_STATUS,
      HttpStatus.BAD_REQUEST
    );
  }

  for (let i = 1; i <= stepIndex; i++) {
    const step = statusFlow[i];
    const key = timelineMap[step];
    if (key && !timeline[key]) {
      timeline[key] = now;
    }
  }

  order.orderStatus = newStatus;

  /* ----------------------------------------------------
     ITEM LEVEL STATUS UPDATE
  ---------------------------------------------------- */
  order.orderedItems.forEach((item) => {
    if (
      item.itemStatus === "Cancelled" ||
      item.itemStatus === "Returned" ||
      item.itemStatus === "ReturnApproved"
    ) {
      return;
    }

    item.itemStatus = newStatus;
    item.itemTimeline ||= {};

    const timeKey = timelineMap[newStatus];
    if (timeKey && !item.itemTimeline[timeKey]) {
      item.itemTimeline[timeKey] = now;
    }
  });

  /* ----------------------------------------------------
     DELIVERED CASE
  ---------------------------------------------------- */
  if (newStatus === "Delivered") {
    order.deliveredDate = now;
    order.paymentStatus = "Paid";

    // Complete referral reward
    await completeReferralReward(order.userId, order._id);
  }

  order.markModified("statusTimeline");
  order.markModified("orderedItems");

  await saveOrder(order);
  return order;
};
