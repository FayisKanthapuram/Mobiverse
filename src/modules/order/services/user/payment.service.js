import mongoose from "mongoose";
import  {razorpay}  from "../../../../config/razorpay.js";
import { deleteUserCart } from "../../../cart/cart.repo.js";
import { createOrder } from "../../repo/order.repo.js";
import { findTempOrderById, updateTempOrder } from "../../repo/temp.order.repo.js";
import crypto from "crypto"

export const createRazorpayOrderService = async ({ amount, tempOrderId }) => {
  const options = {
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `temp_${tempOrderId}`,
  };

  return await razorpay.orders.create(options);
};

export const verifyRazorpayPaymentService = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  tempOrderId,
  userId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tempOrder = await findTempOrderById(tempOrderId);
    if (!tempOrder) throw { status: 400, message: "Temp order not found" };

    // Validate signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expected !== razorpay_signature) {
      throw { status: 400, message: "Invalid Razorpay signature" };
    }

    // Update temp entry
    await updateTempOrder(
      tempOrderId,
      {
        paymentStatus: "Success",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      session
    );

    // Create final order
    const order = await createOrder(
      {
        userId,
        addressId: tempOrder.addressId,
        orderedItems: tempOrder.orderedItems,
        shippingAddress: tempOrder.shippingAddress,
        subtotal: tempOrder.subtotal,
        discount: tempOrder.discount,
        couponDiscount: tempOrder.couponDiscount,
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

    // Clear cart
    await deleteUserCart(userId);

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      status: 200,
      message: "Payment verified successfully",
      orderId: order.orderId,
    };
  } catch (err) {
    console.log(err)
    await session.abortTransaction();
    session.endSession();

    return {
      success: false,
      status: err.status || 500,
      message: err.message || "Verification failed",
    };
  }
};
