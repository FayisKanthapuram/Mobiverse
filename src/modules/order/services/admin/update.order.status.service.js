import { findOrderById, saveOrder } from "../../order.repo.js";

export const updateOrderStatusService = async (orderId, newStatus) => {
  const order = await findOrderById(orderId);

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  const now = new Date();

  // Initialize timeline
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
    const err = new Error("Invalid order status");
    err.status = 400;
    throw err;
  }

  // -------------------------------------------------
  // SPECIAL CASES: CANCELLED
  // -------------------------------------------------
  if (newStatus === "Cancelled") {
    timeline.cancelledAt = now;
    order.orderStatus = "Cancelled";

    order.orderedItems.forEach((item) => {
      if (item.itemStatus !== "Cancelled") {
        item.itemStatus = "Cancelled";
        if (!item.itemTimeline) item.itemTimeline = {};
        item.itemTimeline.cancelledAt = now;
      }
    });

    await saveOrder(order);
    return order;
  }

  // -------------------------------------------------
  // SPECIAL CASES: RETURNED
  // -------------------------------------------------
  if (newStatus === "Returned") {
    timeline.returnedAt = now;
    order.orderStatus = "Returned";

    order.orderedItems.forEach((item) => {
      if (item.itemStatus !== "Returned") {
        item.itemStatus = "Returned";
        if (!item.itemTimeline) item.itemTimeline = {};
        item.itemTimeline.returnedAt = now;
      }
    });

    await saveOrder(order);
    return order;
  }

  // -------------------------------------------------
  // NORMAL FLOW: AUTO-FILL TIMELINE
  // -------------------------------------------------
  const stepIndex = statusFlow.indexOf(newStatus);
  if (stepIndex === -1) {
    const err = new Error("Invalid sequential order status");
    err.status = 400;
    throw err;
  }

  for (let i = 1; i <= stepIndex; i++) {
    const step = statusFlow[i];
    const key = timelineMap[step];
    if (key && !timeline[key]) {
      timeline[key] = now;
    }
  }

  order.orderStatus = newStatus;

  // Update item-level timeline
  order.orderedItems.forEach((item) => {
    if (
      item.itemStatus === "Cancelled" ||
      item.itemStatus === "Returned" ||
      item.itemStatus === "ReturnApproved"
    ) {
      return; // don't modify cancelled/returned items
    }

    item.itemStatus = newStatus;

    if (!item.itemTimeline) item.itemTimeline = {};

    const timeKey = timelineMap[newStatus];
    if (timeKey && !item.itemTimeline[timeKey]) {
      item.itemTimeline[timeKey] = now;
    }
  });

  if (newStatus === "Delivered") {
    order.deliveredDate = now;
  }

  order.markModified("statusTimeline");
  order.markModified("orderedItems");

  await saveOrder(order);

  return order;
};
