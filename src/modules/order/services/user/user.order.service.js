import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { orderValidation } from "../../order.validator.js";

import { findAddressById } from "../../../address/address.repo.js";
import { createOrder, findOrderByOrderId } from "../../repo/order.repo.js";
import {
  decrementVariantStock,
  incrementVariantStock,
  reserveVariantStock,
} from "../../../product/repo/variant.repo.js";
import { clearCart, fetchCartItems } from "../../../cart/cart.repo.js";
import { calculateCartTotals } from "../../../cart/helpers/cartTotals.helper.js";
import { couponUsageCreate } from "../../../coupon/repo/coupon.usage.repo.js";
import { findCouponIncrementCount } from "../../../coupon/repo/coupon.repo.js";
import {
  findWalletByUserId,
  updateWalletBalanceAndCredit,
  updateWalletHoldBalance,
  updateWalletTotalDebits,
} from "../../../wallet/repo/wallet.repo.js";
import mongoose from "mongoose";
import {
  createHoldRecord,
  updateHoldStatus,
} from "../../../wallet/repo/wallet.hold.repo.js";
import { createLedgerEntry } from "../../../wallet/repo/wallet.ledger.repo.js";
import { updateUserWalletBalance } from "../../../user/user.repo.js";
import {
  completeReferralReward,
  markReferralAsPending,
} from "../../../referral/referral.service.js";

import {
  createTempOrder,
  updateTempOrder,
} from "../../repo/temp.order.repo.js";
import { createRazorpayOrderService } from "./payment.service.js";
import { findTempOrderById } from "../../repo/temp.order.repo.js";
import { getAppliedOffer } from "../../../product/helpers/user.product.helper.js";
import { CheckoutMessages } from "../../../../shared/constants/messages/checkoutMessages.js";
import {
  acquireUserOrderLock,
  releaseUserOrderLock,
} from "../../repo/order.lock.repo.js";

// User order service - handle user order placement and processing
export const placeOrderService = async (userId, body, appliedCoupon) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let holdRecord = null;

  try {
    // 1️⃣ Validation
    const { error } = orderValidation.validate(body);
    if (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        success: false,
        message: error.details[0].message,
      };
    }

    const { addressId, paymentMethod } = body;

    // 2️⃣ Acquire user-level order lock (CRITICAL)
    const lockAcquired = await acquireUserOrderLock(userId, session);
    if (!lockAcquired) {
      throw new AppError(
        "Another order is being processed. Please wait.",
        HttpStatus.CONFLICT
      );
    }

    // 3️⃣ Address
    const address = await findAddressById(addressId, session);
    if (!address) {
      throw new AppError("Address not found", HttpStatus.NOT_FOUND);
    }

    // 4️⃣ Cart items (session-safe)
    const items = await fetchCartItems(userId, session);
    if (!items.length) {
      throw new AppError("Your cart is empty", HttpStatus.BAD_REQUEST);
    }

    // 5️⃣ Apply offers
    for (const item of items) {
      item.offer = getAppliedOffer(item, item.variantId.salePrice) || 0;
    }

    // 6️⃣ Cart totals
    const cartTotals = await calculateCartTotals(userId, items);
    if (cartTotals.hasAdjustedItem) {
      await session.abortTransaction();
      session.endSession();

      return {
        status: HttpStatus.CONFLICT,
        success: false,
        code: "CART_ADJUSTED",
        message: CheckoutMessages.ADJUSTED_ITEM_QUANTITIES,
      };
    }

    if (paymentMethod === "razorpay") {
      for (const item of items) {
        const result = await reserveVariantStock(
          item.variantId._id,
          item.quantity,
          session
        );

        if (result.modifiedCount === 0) {
          throw new AppError(
            `Insufficient stock for ${item.productId.name}`,
            HttpStatus.CONFLICT
          );
        }
      }
    }

    // 7️⃣ Shipping address snapshot
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

    // 8️⃣ Final amount
    let finalAmount =
      cartTotals.subtotal - cartTotals.discount + cartTotals.deliveryCharge;

    if (
      paymentMethod === "cod" &&
      finalAmount - (appliedCoupon?.discount || 0) >= 20000
    ) {
      throw new AppError(
        "Cash on Delivery is allowed only for orders below ₹20,000",
        HttpStatus.BAD_REQUEST
      );
    }

    const orderedItems = items.map((item) => ({
      productId: item.productId._id,
      variantId: item.variantId._id,
      quantity: item.quantity,
      regularPrice: item.variantId.regularPrice ?? 0,
      offer: item.offer ?? 0,
      price: item.variantId.salePrice ?? 0, // final sale price(copon or offer is not included)
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Paid",
      couponShare: appliedCoupon
        ? ((item.variantId.salePrice - (item.offer || 0)) / finalAmount) *
          appliedCoupon.discount
        : 0,
    }));

    if (appliedCoupon) {
      finalAmount = finalAmount - appliedCoupon.discount;
    }

    const orderId = new mongoose.Types.ObjectId();

    // 🔟 Wallet HOLD
    if (paymentMethod === "wallet") {
      const wallet = await findWalletByUserId(userId, session);
      if (!wallet || wallet.balance - wallet.holdBalance < finalAmount) {
        throw new AppError(
          "Insufficient wallet balance",
          HttpStatus.BAD_REQUEST
        );
      }

      await updateWalletHoldBalance(userId, finalAmount, session);

      const [hold] = await createHoldRecord(
        {
          userId,
          walletId: wallet._id,
          orderId,
          amount: finalAmount,
          status: "HELD",
        },
        session
      );

      holdRecord = hold;

      await createLedgerEntry(
        {
          walletId: wallet._id,
          userId,
          amount: -finalAmount,
          type: "HOLD",
          referenceId: orderId,
          note: "Wallet amount reserved for order",
          balanceAfter: wallet.balance,
        },
        session
      );
    }

    // 1️⃣1️⃣ Razorpay TEMP order (commit early)
    if (paymentMethod === "razorpay") {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      const [tempOrder] = await createTempOrder(
        {
          userId,
          addressId,
          orderedItems: orderedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            regularPrice: i.regularPrice,
            offer: i.offer,
            price: i.price,
            couponShare: i.couponShare,
          })),
          shippingAddress,
          subtotal: cartTotals.subtotal,
          discount: cartTotals.discount,
          couponDiscount: appliedCoupon?.discount || 0,
          couponCode: appliedCoupon?.code,
          couponId: appliedCoupon?.couponId || null,
          finalAmount,
          paymentMethod: "razorpay",
          expiresAt,
        },
        session
      );

      await releaseUserOrderLock(userId, session);

      await markReferralAsPending(userId, tempOrder._id, session);

      await session.commitTransaction();
      session.endSession();

      const razorpayOrder = await createRazorpayOrderService({
        amount: finalAmount,
        tempOrderId: tempOrder._id,
      });

      await updateTempOrder(userId, tempOrder._id, {
        razorpayOrderId: razorpayOrder.id,
      });

      return {
        status: HttpStatus.OK,
        success: true,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        tempOrderId: tempOrder._id,
      };
    }

    // 1️⃣2️⃣ Safe stock decrement
    for (const item of items) {
      const result = await decrementVariantStock(
        item.variantId._id,
        item.quantity,
        session
      );

      if (result.modifiedCount === 0) {
        throw new AppError(
          `Insufficient stock for ${item.productId.name}`,
          HttpStatus.CONFLICT
        );
      }
    }

    // 1️⃣3️⃣ Create final order
    const order = await createOrder(
      {
        _id: orderId,
        userId,
        addressId,
        orderedItems,
        shippingAddress,
        subtotal: cartTotals.subtotal,
        deliveryCharge: cartTotals.deliveryCharge,
        discount: cartTotals.discount,
        couponDiscount: appliedCoupon?.discount || 0,
        couponCode: appliedCoupon?.code,
        couponId: appliedCoupon?.couponId || null,
        finalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "wallet" ? "Paid" : "Pending",
        expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      session
    );

    await markReferralAsPending(userId, orderId, session);

    // 1️⃣4️⃣ Wallet CAPTURE
    if (paymentMethod === "wallet") {
      const wallet = await findWalletByUserId(userId, session);

      await updateWalletHoldBalance(userId, -finalAmount, session);
      await updateWalletBalanceAndCredit(userId, -finalAmount, session);
      await updateWalletTotalDebits(userId, finalAmount, session);
      await updateHoldStatus(holdRecord._id, "CAPTURED", session);

      await updateUserWalletBalance(
        userId,
        wallet.balance - finalAmount,
        session
      );

      await createLedgerEntry(
        {
          walletId: wallet._id,
          userId,
          amount: -finalAmount,
          type: "DEBIT",
          referenceId: orderId,
          note: `Wallet payment captured for order ${order.orderId}`,
          balanceAfter: wallet.balance - finalAmount,
        },
        session
      );
    }

    // 1️⃣5️⃣ Clear cart INSIDE transaction
    await clearCart(userId, session);

    // 1️⃣6️⃣ Coupon usage
    if (appliedCoupon) {
      await couponUsageCreate(
        appliedCoupon.couponId,
        userId,
        order._id,
        appliedCoupon.discount,
        session
      );
      const updatedCoupon = await findCouponIncrementCount(
        appliedCoupon.couponId,
        session
      );

      if (!updatedCoupon) {
        throw new AppError("Coupon usage limit exceeded", HttpStatus.CONFLICT);
      }
    }

    // 1️⃣7️⃣ Release lock & commit
    await releaseUserOrderLock(userId, session);

    await session.commitTransaction();
    session.endSession();

    return {
      status: HttpStatus.OK,
      success: true,
      message: "Order placed successfully",
      orderId: order.orderId,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const retryPaymentService = async (tempOrderId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tempOrder = await findTempOrderById(tempOrderId, userId);
    if (!tempOrder) {
      throw new AppError("Order not found", HttpStatus.NOT_FOUND);
    }

    const razorpayOrder = await createRazorpayOrderService({
      amount: tempOrder.finalAmount,
      tempOrderId: tempOrder._id,
    });

    await updateTempOrder(
      userId,
      tempOrder._id,
      { razorpayOrderId: razorpayOrder.id },
      session
    );

    await session.commitTransaction();
    session.endSession();

    return {
      status: HttpStatus.OK,
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      tempOrderId: tempOrder._id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error);
    throw new AppError("razorpay payment failed", HttpStatus.BAD_REQUEST);
  }
};

// Load order details after successful placement
export const loadOrderSuccessService = async (orderId, userId) => {
  const order = await findOrderByOrderId(orderId, userId);
  if (!order) {
    throw new AppError("Order not found", HttpStatus.NOT_FOUND);
  }

  return order;
};

// Load temporary order on failure
export const loadOrderFailureService = async (orderId, userId) => {
  const order = await findTempOrderById(orderId, userId);

  if (!order) {
    throw new AppError("Order not found", HttpStatus.NOT_FOUND);
  }

  // 🚫 DO NOT treat pending as failed
  if (order.paymentStatus === "Pending") {
    return {
      ...order.toObject(),
      viewType: "PENDING",
    };
  }

  if (order.paymentStatus === "Failed") {
    return {
      ...order.toObject(),
      viewType: "FAILED",
    };
  }

  throw new AppError("Invalid order state", HttpStatus.BAD_REQUEST);
};
