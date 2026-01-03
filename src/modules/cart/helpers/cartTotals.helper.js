import { updateCartItemQuantity } from "../cart.repo.js";

export const calculateCartTotals = async (userId = null, items) => {
  let subtotal = 0;
  let discount = 0;
  let deliveryCharge = 0;
  let hasAdjustedItem = false;

  for (let item of items) {
    // Auto-adjust invalid quantities
    if (item.variantId.stock === 0) {
      hasAdjustedItem = true;
      item.adjusted = true;
      item.quantity = 0;
    } else if (item.quantity > item.variantId.stock) {
      item.quantity = 1;
      hasAdjustedItem = true;
      item.adjusted = true;

      await updateCartItemQuantity(userId, item.variantId._id, 1);
    } else {
      item.adjusted = false;
    }

    // Price calculation
    subtotal += item.variantId.regularPrice * item.quantity;

    discount +=
      (item.variantId.regularPrice - (item.variantId.salePrice - item.offer)) *
      item.quantity;
  }

  return {
    hasAdjustedItem,
    subtotal,
    discount,
    deliveryCharge,
    items,
  };
};

export const calculateBasicCartTotals = (items, variantId) => {
  let subtotal = 0;
  let discount = 0;
  let offer = 0;
  for (const item of items) {
    if (String(item.variantId._id) == String(variantId)) {
      offer = item.offer;
    }
    subtotal += item.variantId.regularPrice * item.quantity;

    if (item.variantId.regularPrice) {
      discount +=
        (item.variantId.regularPrice - item.variantId.salePrice) *
        item.quantity;
    }
    if (item.offer) {
      discount += item.offer * item.quantity;
    }
  }

  return { subtotal, discount, offer };
};
