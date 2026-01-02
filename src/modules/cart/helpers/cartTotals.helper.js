import { updateCartQuantity } from "../cart.repo.js";

export const calculateCartTotals = async (items) => {
  let subtotal = 0;
  let discount = 0;
  let deliveryCharge = 0;
  let hasAdjustedItem=false;

  for (let item of items) {
    // Auto-adjust invalid quantities
    if (item.quantity > item.variantId.stock) {
      item.quantity = 1;
      hasAdjustedItem=true;
      item.adjusted = true;

      await updateCartQuantity(item._id, 1);
    } else if (item.variantId.stock === 0) {
      hasAdjustedItem=true;
      item.adjusted = true;
      item.quantity = 0;
    } else {
      item.adjusted = false;
    }

    // Price calculation
    subtotal += item.variantId.regularPrice * item.quantity;

    discount +=
      (item.variantId.regularPrice - (item.variantId.salePrice -item.offer)) *
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

export const calculateBasicCartTotals = (items,itemId) => {
  let subtotal = 0;
  let discount = 0;
  let offer=0;
  for (const item of items) {
    if(String(item._id)==String(itemId)){
      offer=item.offer;
    }
    subtotal += item.variantId.regularPrice * item.quantity;

    if (item.variantId.regularPrice) {
      discount +=
        (item.variantId.regularPrice - (item.variantId.salePrice)) *
        item.quantity;
    }
    if(item.offer){
      discount+=item.offer*item.quantity;
    }
  }

  return { subtotal, discount ,offer};
};
