import {HttpStatus} from "../constants/statusCode.js";
import {orderValidation} from "../validators/OrderValidator.js";

import { findAddressById } from "../repositories/address.repo.js";
import { createOrder } from "../repositories/order.repo.js";
import { decrementProductStock } from "../repositories/product.repo.js";
import { decrementVariantStock } from "../repositories/variant.repo.js";
import { deleteUserCart, fetchCartItems } from "../repositories/cart.repo.js";
import { calculateCartTotals } from "../helpers/cartTotals.helper.js";


export const placeOrderService = async (userId, body) => {
  // -------------------------------
  // 1. Validate Input
  // -------------------------------
  const { error } = orderValidation.validate(body);
  if (error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: error.details[0].message,
    };
  }

  const { addressId, paymentMethod } = body;

  // -------------------------------
  // 2. Check Address
  // -------------------------------
  const address = await findAddressById(addressId);
  if (!address) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "The selected address was not found.",
    };
  }

  // -------------------------------
  // 3. Cart validation
  // -------------------------------
  const items = await fetchCartItems(userId);
  if (!items.length) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: "Your cart is empty.",
    };
  }

  const cartTotals = await calculateCartTotals(items);

  // -------------------------------
  // 4. Reduce Stock (Product + Variant)
  // -------------------------------
  for (let item of items) {
    await decrementProductStock(item.productId._id, item.quantity);
    await decrementVariantStock(item.variantId._id, item.quantity);
  }

  // -------------------------------
  // 5. Format order items
  // -------------------------------
  const orderedItems = items.map((item) => ({
    productId: item.productId._id,
    variantId: item.variantId._id,
    quantity: item.quantity,
    price: item.variantId.salePrice,
  }));

  // -------------------------------
  // 6. Copy Shipping Address
  // -------------------------------
  const shippingAddress = {
    fullName: address.fullName,
    phone: address.phone,
    address1: address.address1,
    address2: address.address2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    country: address.country,
    addressType: address.addressType,
  };

  // -------------------------------
  // 7. Payment Status
  // -------------------------------
  let paymentStatus = "Pending";
  if (paymentMethod === "razorpay" || paymentMethod === "wallet") {
    paymentStatus = "Paid";
  }

  // -------------------------------
  // 8. Create Order
  // -------------------------------
  const order = await createOrder({
    userId,
    addressId,
    orderedItems,
    shippingAddress,
    paymentMethod,
    paymentStatus,

    subtotal: cartTotals.subtotal,
    deliveryCharge: cartTotals.deliveryCharge,
    tax: cartTotals.tax,
    discount: cartTotals.discount,

    finalAmount:
      cartTotals.subtotal -
      cartTotals.discount +
      cartTotals.deliveryCharge +
      cartTotals.tax,

    expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  // -------------------------------
  // 9. Clear Cart
  // -------------------------------
  await deleteUserCart(userId);

  return {
    status: HttpStatus.OK,
    success: true,
    message: "Order placed successfully",
    orderId: order.orderId,
  };
};
