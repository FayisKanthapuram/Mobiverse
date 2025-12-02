import { findOrderById, saveOrder } from "../../repositories/order.repo.js";

export const handleReturnRequestService = async (orderId, body) => {
  const { itemId, action, adminNote } = body;

  if (!itemId || !action) {
    const err = new Error("Missing itemId or action");
    err.status = 400;
    throw err;
  }

  const validActions = ["approve", "reject"];
  if (!validActions.includes(action)) {
    const err = new Error("Invalid action");
    err.status = 400;
    throw err;
  }

  const order = await findOrderById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  // Find item
  const item = order.orderedItems.id
    ? order.orderedItems.id(itemId)
    : order.orderedItems.find((i) => i._id.toString() === itemId);

  if (!item) {
    const err = new Error("Ordered item not found");
    err.status = 404;
    throw err;
  }

  const now = new Date();

  // Prevent changing terminal statuses
  const terminalStatuses = ["Cancelled", "Returned"];
  if (terminalStatuses.includes(item.itemStatus)) {
    const err = new Error("Cannot change return status for this item");
    err.status = 400;
    throw err;
  }

  // ------------------------
  // APPLY ACTION
  // ------------------------
  if (action === "approve") {
    item.itemStatus = "ReturnApproved";
    if (!item.itemTimeline) item.itemTimeline = {};
    item.itemTimeline.returnApprovedAt = now;

    if (adminNote) item.adminNote = adminNote;
  } else {
    item.itemStatus = "ReturnRejected";
    if (!item.itemTimeline) item.itemTimeline = {};
    item.itemTimeline.returnRejectedAt = now;

    if (adminNote) item.adminNote = adminNote;
  }

  // ------------------------
  // UPDATE ORDER STATUS
  // ------------------------
  const allReturned = order.orderedItems.every(
    (i) => i.itemStatus === "Returned"
  );

  const anyReturnFlow = order.orderedItems.some(
    (i) => i.itemStatus === "ReturnApproved" || i.itemStatus === "Returned"
  );

  if (allReturned) {
    order.orderStatus = "Returned";
  } else if (anyReturnFlow) {
    order.orderStatus = "Partially Returned";
  }

  order.markModified("orderedItems");

  await saveOrder(order);

  return order;
};
