import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { orderValidation } from "../../order.validator.js";

import { findAddressById } from "../../../address/address.repo.js";
import { createOrder, findOrderByOrderId } from "../../order.repo.js";
import { decrementProductStock } from "../../../product/repo/product.repo.js";
import { decrementVariantStock } from "../../../product/repo/variant.repo.js";
import { deleteUserCart, fetchCartItems } from "../../../cart/cart.repo.js";
import { calculateCartTotals } from "../../../cart/cartTotals.helper.js";
import { couponUsageCreate } from "../../../coupon/repo/coupon.usage.repo.js";
import { findCouponIncrementCount } from "../../../coupon/repo/coupon.repo.js";
import { findWalletByUserId } from "../../../wallet/repo/wallet.repo.js";

export const placeOrderService = async (userId, body, appliedCoupon) => {
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

    regularPrice: item.variantId?.regularPrice ?? 0,

    offer: item.offer ?? 0,

    price: item.variantId?.salePrice ?? 0,
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

  let finalAmount =
    cartTotals.subtotal -
    cartTotals.discount +
    cartTotals.deliveryCharge +
    cartTotals.tax;

  if (appliedCoupon) {
    finalAmount = finalAmount - appliedCoupon.discount;
  }

  if (paymentMethod === "wallet") {
    let wallet = await findWalletByUserId(userId);

    if (!wallet || wallet.balance < amount) {
      return res.json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    // Deduct wallet balance
    wallet.balance -= amount;

    wallet.transactions.push({
      type: "debit",
      amount: amount,
      description: "Order payment",
      date: new Date(),
    });

    await wallet.save();
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
    couponDiscount: appliedCoupon?.discount || 0,
    couponId: appliedCoupon?.couponId || null,

    finalAmount,

    expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  });

  // -------------------------------
  // 9. Clear Cart
  // -------------------------------
  await deleteUserCart(userId);

  if (appliedCoupon) {
    await couponUsageCreate(
      appliedCoupon.couponId,
      userId,
      order._id,
      appliedCoupon.discount
    );
    const inc = await findCouponIncrementCount(appliedCoupon.couponId);
  }
  return {
    status: HttpStatus.OK,
    success: true,
    message: "Order placed successfully",
    orderId: order.orderId,
  };
};

export const loadOrderSuccessService = async (orderId) => {
  const order = await findOrderByOrderId(orderId);

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  return order;
};
