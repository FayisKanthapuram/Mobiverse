import mongoose from "mongoose";
import { razorpay } from "../../../../config/razorpay.js";
import { clearCart } from "../../../cart/cart.repo.js";
import { createOrder } from "../../repo/order.repo.js";
import {
  deleteTempOrder,
  findTempOrderById,
  updateTempOrder,
} from "../../repo/temp.order.repo.js";
import crypto from "crypto";
import { decrementVariantStock } from "../../../product/repo/variant.repo.js";
import { couponUsageCreate } from "../../../coupon/repo/coupon.usage.repo.js";
import { findCouponIncrementCount } from "../../../coupon/repo/coupon.repo.js";
import { completeReferralReward } from "../../../referral/referral.service.js";

// Payment service - handle Razorpay payment processing
// Create Razorpay order
export const createRazorpayOrderService = async ({ amount, tempOrderId }) => {
  const options = {
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `temp_${tempOrderId}`,
  };

  return await razorpay.orders.create(options);
};

// Verify and process Razorpay payment
export const verifyRazorpayPaymentService = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  tempOrderId,
  userId,
  appliedCoupon,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tempOrder = await findTempOrderById(tempOrderId, userId);
    if (!tempOrder) throw { status: 400, message: "Temp order not found" };

    // Verify Razorpay payment signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      throw { status: 400, message: "Invalid Razorpay signature" };
    }

    // Update temporary order with payment details
    await updateTempOrder(
      userId,
      tempOrderId,
      {
        paymentStatus: "Success",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      session
    );

    // Decrement variant stock for each item
    for (let item of tempOrder.orderedItems) {
      await decrementVariantStock(item.variantId._id, item.quantity, session);
    }

    // Create final order from temp order
    const order = await createOrder(
      {
        userId,
        addressId: tempOrder.addressId,
        orderedItems: tempOrder.orderedItems,
        shippingAddress: tempOrder.shippingAddress,
        subtotal: tempOrder.subtotal,
        discount: tempOrder.discount,
        couponDiscount: tempOrder.couponDiscount,
        couponCode: tempOrder.couponCode,
        couponId: tempOrder.couponId,
        finalAmount: tempOrder.finalAmount,
        paymentMethod: "razorpay",
        paymentStatus: "Paid",
        expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      },
      session
    );

    if (appliedCoupon) {
      await couponUsageCreate(
        appliedCoupon.couponId,
        userId,
        order._id,
        appliedCoupon.discount
      );
      await findCouponIncrementCount(appliedCoupon.couponId);
    }

    // Clear user shopping cart
    await clearCart(userId);

    // Complete referral reward if applicable
    await completeReferralReward(userId, order._id, session);

    // Delete temporary order
    await deleteTempOrder(tempOrderId, session);

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      status: 200,
      message: "Payment verified successfully",
      orderId: order.orderId,
    };
  } catch (err) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();

    return {
      success: false,
      status: err.status || 500,
      message: err.message || "Verification failed",
    };
  }
};
