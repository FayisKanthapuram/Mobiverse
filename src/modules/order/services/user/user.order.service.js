import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { orderValidation } from "../../order.validator.js";

import { findAddressById } from "../../../address/address.repo.js";
import { createOrder, findOrderByOrderId } from "../../repo/order.repo.js";
import {
  decrementVariantStock,
  incrementVariantStock,
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

// User order service - handle user order placement and processing
// Place order and process payment
export const placeOrderService = async (userId, body, appliedCoupon) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error } = orderValidation.validate(body);
    if (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        success: false,
        message: error.details[0].message,
      };
    }

    const { addressId, paymentMethod } = body;

    // Fetch and validate shipping address
    const address = await findAddressById(addressId);
    if (!address) throw new AppError("Address not found", HttpStatus.NOT_FOUND);

    // Fetch cart items for user
    const items = await fetchCartItems(userId);
    // Calculate applied offers for each item
    for (let item of items) {
      item.offer = getAppliedOffer(item, item?.variantId?.salePrice) || 0;
    }
    if (!items.length) throw new AppError("Your cart is empty", HttpStatus.BAD_REQUEST);
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

    // Copy shipping address from address document
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

    // Calculate final amount with all charges
    let finalAmount =
      cartTotals.subtotal - cartTotals.discount + cartTotals.deliveryCharge;

    if (
      paymentMethod === "cod" &&
      finalAmount - appliedCoupon?.discount >= 20000
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
    let holdRecord = null;

    // Handle wallet payment with hold balance
    if (paymentMethod === "wallet") {
      const wallet = await findWalletByUserId(userId, session);

      if (!wallet || wallet.balance - wallet.holdBalance < finalAmount) {
        throw new AppError("Insufficient wallet balance", HttpStatus.BAD_REQUEST);
      }

      // Increase holdBalance
      await updateWalletHoldBalance(userId, finalAmount, session);

      // Create hold record
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

      // Ledger: HOLD
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

    // Create temporary order for Razorpay payment
    if (paymentMethod === "razorpay") {
      try {
        const [tempOrder] = await createTempOrder(
          {
            userId,
            addressId,
            orderedItems,
            shippingAddress,
            subtotal: cartTotals.subtotal,
            discount: cartTotals.discount,
            couponDiscount: appliedCoupon?.discount || 0,
            couponCode: appliedCoupon?.code,
            couponId: appliedCoupon?.couponId || null,
            finalAmount,
            paymentMethod: "razorpay",
          },
          session
        );

        const razorpayOrder = await createRazorpayOrderService({
          amount: finalAmount,
          tempOrderId: tempOrder._id,
        });

        await updateTempOrder(
          tempOrder._id,
          { razorpayOrderId: razorpayOrder.id },
          session
        );

        await markReferralAsPending(userId, tempOrder._id, session);

        await session.commitTransaction();
        session.endSession();

        return {
          status: 200,
          success: true,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          tempOrderId: tempOrder._id,
        };
      } catch  {
        await session.abortTransaction();
        session.endSession();

        throw new AppError("razorpay payment failed", HttpStatus.BAD_REQUEST);
      }
    }

    // Decrement inventory stock
    for (let item of items) {
      await decrementVariantStock(item.variantId._id, item.quantity, session);
    }

    // Create final order with all details
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

    //mark referral as pending
    await markReferralAsPending(userId, orderId, session);

    // Capture wallet payment if selected
    if (paymentMethod === "wallet") {
      try {
        const wallet = await findWalletByUserId(userId, session);

        // Remove hold
        await updateWalletHoldBalance(userId, -finalAmount, session);

        // Deduct actual money
        await updateWalletBalanceAndCredit(userId, -finalAmount, session);

        // Update hold status
        await updateHoldStatus(holdRecord._id, "CAPTURED", session);

        //update user wallet balance
        await updateUserWalletBalance(
          userId,
          wallet.balance - finalAmount,
          session
        );

        await updateWalletTotalDebits(userId, finalAmount, session);

        // Ledger: DEBIT
        await createLedgerEntry(
          {
            walletId: wallet._id,
            userId,
            amount: -finalAmount,
            type: "DEBIT",
            referenceId: orderId,
            note: `Wallet payment captured for order :- ${order.orderId}`,
            balanceAfter: wallet.balance - finalAmount,
          },
          session
        );

        await completeReferralReward(userId, order._id, session);
      } catch (err) {
        console.log(err);
        // Release hold on failure
        await updateWalletHoldBalance(userId, -finalAmount, session);
        await updateHoldStatus(holdRecord._id, "RELEASED", session);

        await createLedgerEntry(
          {
            walletId: holdRecord.walletId,
            userId,
            amount: finalAmount,
            type: "RELEASE",
            referenceId: orderId,
            note: "Wallet capture failed → Hold released",
          },
          session
        );

        // Restore stock
        for (let item of orderedItems) {
          await incrementVariantStock(item.variantId, item.quantity, session);
        }

        throw new AppError("Wallet payment failed", HttpStatus.BAD_REQUEST);
      }
    }

    // Clear user shopping cart
    await clearCart(userId);

    // Record coupon usage
    if (appliedCoupon) {
      await couponUsageCreate(
        appliedCoupon.couponId,
        userId,
        order._id,
        appliedCoupon.discount
      );
      await findCouponIncrementCount(appliedCoupon.couponId);
    }

    await session.commitTransaction();
    session.endSession();

    return {
      status: HttpStatus.OK,
      success: true,
      message: "Order placed successfully",
      orderId: order.orderId,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return {
      status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || "Order failed",
    };
  }
};

export const retryPaymentService = async (tempOrderId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const tempOrder = await findTempOrderById(tempOrderId);
    if (!tempOrder) {
      throw new AppError("Order not found", HttpStatus.NOT_FOUND);
    }

    const razorpayOrder = await createRazorpayOrderService({
      amount: tempOrder.finalAmount,
      tempOrderId: tempOrder._id,
    });

    await updateTempOrder(
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
export const loadOrderSuccessService = async (orderId) => {
  const order = await findOrderByOrderId(orderId);
  if (!order) {
    throw new AppError("Order not found", HttpStatus.NOT_FOUND);
  }

  return order;
};

// Load temporary order on failure
export const loadOrderFailureService = async (orderId) => {
  const order = await findTempOrderById(orderId);
  if (!order) {
    throw new AppError("Order not found", HttpStatus.NOT_FOUND);
  }

  return order;
};
