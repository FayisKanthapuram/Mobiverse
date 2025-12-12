import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { orderValidation } from "../../order.validator.js";

import { findAddressById } from "../../../address/address.repo.js";
import { createOrder, findOrderByOrderId } from "../../repo/order.repo.js";
import {
  decrementProductStock,
  incrementProductStock,
} from "../../../product/repo/product.repo.js";
import {
  decrementVariantStock,
  incrementVariantStock,
} from "../../../product/repo/variant.repo.js";
import { deleteUserCart, fetchCartItems } from "../../../cart/cart.repo.js";
import { calculateCartTotals } from "../../../cart/cartTotals.helper.js";
import { couponUsageCreate } from "../../../coupon/repo/coupon.usage.repo.js";
import { findCouponIncrementCount } from "../../../coupon/repo/coupon.repo.js";
import {
  findWalletByUserId,
  updateWalletBalance,
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

    // -------------------------------
    // 1. Fetch Address
    // -------------------------------
    const address = await findAddressById(addressId);
    if (!address) throw { status: 404, message: "Address not found" };

    // -------------------------------
    // 2. Fetch Cart Items
    // -------------------------------
    const items = await fetchCartItems(userId);
    if (!items.length) throw { status: 400, message: "Your cart is empty" };

    const cartTotals = await calculateCartTotals(items);

    // -------------------------------
    // 3. Reduce Stock
    // -------------------------------
    for (let item of items) {
      await decrementProductStock(item.productId._id, item.quantity, session);
      await decrementVariantStock(item.variantId._id, item.quantity, session);
    }

    // -------------------------------
    // 4. Format orderedItems
    // -------------------------------
    const orderedItems = items.map((item) => ({
      productId: item.productId._id,
      variantId: item.variantId._id,
      quantity: item.quantity,

      regularPrice: item.variantId.regularPrice ?? 0,
      offer: item.offer ?? 0,
      price: item.variantId.salePrice ?? 0, // final sale price
    }));

    // -------------------------------
    // 5. Copy Shipping Address
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
    // 6. Calculate Final Amount
    // -------------------------------
    let finalAmount =
      cartTotals.subtotal -
      cartTotals.discount +
      cartTotals.deliveryCharge +
      cartTotals.tax;

    if (appliedCoupon) {
      finalAmount = finalAmount - appliedCoupon.discount;
    }

    const orderId = new mongoose.Types.ObjectId();
    let holdRecord = null;

    // -------------------------------
    // 7A. Wallet Payment → HOLD
    // -------------------------------
    if (paymentMethod === "wallet") {
      const wallet = await findWalletByUserId(userId, session);

      if (!wallet || wallet.balance - wallet.holdBalance < finalAmount) {
        throw {
          status: HttpStatus.BAD_REQUEST,
          message: "Insufficient wallet balance",
        };
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

    // -------------------------------
    // 7B. Razorpay → TEMP ORDER + RETURN PAYMENT DETAILS
    // -------------------------------
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
            couponId: appliedCoupon?.couponId || null,
            finalAmount,
            paymentMethod: "razorpay",
            paymentStatus: "Pending",
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

        await session.commitTransaction();
        session.endSession();

        return {
          status: 200,
          success: true,
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          tempOrderId: tempOrder._id,
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();

        throw {
          status: HttpStatus.BAD_REQUEST,
          message: "razorpay payment failed",
        };
      }
    }

    // -------------------------------
    // 8. Create Order (FULL FIELDS)
    // -------------------------------
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
        couponId: appliedCoupon?.couponId || null,

        finalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "wallet" ? "Paid" : "Pending",
        expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      session
    );

    await markReferralAsPending(userId, orderId, session);

    // -------------------------------
    // 9. CAPTURE WALLET PAYMENT
    // -------------------------------
    if (paymentMethod === "wallet") {
      try {
        const wallet = await findWalletByUserId(userId, session);

        // Remove hold
        await updateWalletHoldBalance(userId, -finalAmount, session);

        // Deduct actual money
        await updateWalletBalance(userId, -finalAmount, session);

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
          await incrementProductStock(item.productId, item.quantity, session);
          await incrementVariantStock(item.variantId, item.quantity, session);
        }

        throw {
          status: HttpStatus.BAD_REQUEST,
          message: "Wallet payment failed",
        };
      }
    }

    // -------------------------------
    // 10. Clear Cart
    // -------------------------------
    await deleteUserCart(userId);

    // -------------------------------
    // 11. Coupon Usage
    // -------------------------------
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
      status: 200,
      success: true,
      message: "Order placed successfully",
      orderId: order.orderId,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return {
      status: error.status || 500,
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
      return res.json({ success: false, message: "Order not found" });
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
      status: 200,
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      tempOrderId: tempOrder._id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error)
    throw {
      status: HttpStatus.BAD_REQUEST,
      message: "razorpay payment failed",
    };
  }
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

export const loadOrderFailureService = async (orderId) => {
  const order = await findTempOrderById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  return order;
};
