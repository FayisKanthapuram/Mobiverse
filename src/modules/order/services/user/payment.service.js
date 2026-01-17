import mongoose from "mongoose";
import { razorpay } from "../../../../config/razorpay.js";
import { clearCart } from "../../../cart/cart.repo.js";
import { createOrder } from "../../repo/order.repo.js";
import {
  deleteTempOrder,
  deleteTempOrderById,
  
  findActiveTempOrderByUser,
  findTempOrderById,
  markTempOrderPaymentFailed,
  updateTempOrder,
} from "../../repo/temp.order.repo.js";
import crypto from "crypto";
import { confirmReservedStock, releaseReservedStock } from "../../../product/repo/variant.repo.js";
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
  // Fetch temp order OUTSIDE transaction
  const tempOrder = await findTempOrderById(tempOrderId, userId);
  if (!tempOrder) {
    return { success: false, status: 400, message: "Temp order not found" };
  }

  // Expiry guard
  if (tempOrder.expiresAt < new Date()) {
    return { success: false, status: 410, message: "Payment window expired" };
  }

  //  Verify signature
  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(sign)
    .digest("hex");

  if (expected !== razorpay_signature) {
    return {
      success: false,
      status: 400,
      message: "Invalid Razorpay signature",
    };
  }

  // SHORT TRANSACTION (ONLY WHAT MUST BE ATOMIC)
  const session = await mongoose.startSession();
  let order;

  try {
    session.startTransaction();

    // confirm reserved stock
    for (const item of tempOrder.orderedItems) {
      await confirmReservedStock(item.variantId, item.quantity, session);
    }

    // create final order
    order = await createOrder(
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

    await session.commitTransaction();
  } catch {
    await session.abortTransaction();
    session.endSession();

    return {
      success: false,
      status: 409,
      message: "Payment verification conflict. Please retry.",
    };
  }

  session.endSession();

  // EVERYTHING ELSE — OUTSIDE TRANSACTION

  await updateTempOrder(userId, tempOrderId, {
    paymentStatus: "Success",
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  if (appliedCoupon) {
    await couponUsageCreate(
      appliedCoupon.couponId,
      userId,
      order._id,
      appliedCoupon.discount
    );
    await findCouponIncrementCount(appliedCoupon.couponId);
  }

  await clearCart(userId);
  await completeReferralReward(userId, order._id);
  await deleteTempOrder(tempOrderId);

  return {
    success: true,
    status: 200,
    message: "Payment verified successfully",
    orderId: order.orderId,
  };
};


export const abandonPendingPaymentService = async (userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tempOrder = await findActiveTempOrderByUser(userId, session);

    // No pending order → nothing to do
    if (!tempOrder) {
      await session.commitTransaction();
      session.endSession();
      return { success: true };
    }

    // Release reserved stock
    for (const item of tempOrder.orderedItems) {
      await releaseReservedStock(item.variantId, item.quantity, session);
    }

    // Delete temp order
    await deleteTempOrderById(tempOrder._id, session);

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const markRazorpayPaymentFailedService = async (tempOrderId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await markTempOrderPaymentFailed(tempOrderId, userId, session);

    await session.commitTransaction();
    session.endSession();

    return { success: true };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

