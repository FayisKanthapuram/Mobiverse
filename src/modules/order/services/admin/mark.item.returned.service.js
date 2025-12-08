import { findOrderById, saveOrder } from "../../order.repo.js";
import { findProductById, saveProduct } from "../../../product/repo/product.repo.js";
import { findVariantById, saveVariant } from "../../../product/repo/variant.repo.js";

export const markItemReturnedService = async (orderId, body) => {
  const { itemId } = body;

  if (!itemId) {
    const err = new Error("Missing itemId");
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
  const item = order.orderedItems.find(
    (i) => i._id.toString() === itemId
  );

  if (!item) {
    const err = new Error("Ordered item not found");
    err.status = 404;
    throw err;
  }

  // Already returned?
  if (item.itemStatus === "Returned") {
    const err = new Error("Item already marked as returned");
    err.status = 400;
    throw err;
  }

  // Find product + variant
  const variant = await findVariantById(item.variantId);
  const product = await findProductById(item.productId);

  if (!variant || !product) {
    const err = new Error("Product or variant not found");
    err.status = 400;
    throw err;
  }

  // Restore stock
  product.totalStock += item.quantity;
  variant.stock += item.quantity;

  await saveProduct(product);
  await saveVariant(variant);

  // Update item status
  const now = new Date();
  item.itemStatus = "Returned";

  if (!item.itemTimeline) item.itemTimeline = {};
  item.itemTimeline.returnedAt = now;

  // ORDER LEVEL STATUS
  const allReturned = order.orderedItems.every(
    (i) => i.itemStatus === "Returned"
  );

  const anyReturned = order.orderedItems.some(
    (i) => i.itemStatus === "Returned"
  );

  if (allReturned) {
    order.orderStatus = "Returned";
    order.statusTimeline = order.statusTimeline || {};
    order.statusTimeline.returnedAt = now;
  } else if (anyReturned) {
    order.orderStatus = "Partially Returned";
  }

  order.markModified("orderedItems");
  await saveOrder(order);

  return order;
};
