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
import mongoose from "mongoose";

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
    // Address Validation
    // -------------------------------
    const address = await findAddressById(addressId);
    if (!address) throw { status: HttpStatus.NOT_FOUND, message: "Address not found" };

    // -------------------------------
    // Cart Fetch
    // -------------------------------
    const items = await fetchCartItems(userId);
    if (!items.length) throw { status: HttpStatus.BAD_REQUEST, message: "Your cart is empty" };

    const totals = await calculateCartTotals(items);

    // -------------------------------
    // Stock Decrease
    // -------------------------------
    for (let item of items) {
      await decrementProductStock(item.productId._id, item.quantity, session);
      await decrementVariantStock(item.variantId._id, item.quantity, session);
    }

    // -------------------------------
    // Format Order Items
    // -------------------------------
    const orderedItems = items.map((item) => ({
      productId: item.productId._id,
      variantId: item.variantId._id,
      quantity: item.quantity,
      price: item.variantId.salePrice,
    }));

    // -------------------------------
    // Final Amount
    // -------------------------------
    let finalAmount =
      totals.subtotal - totals.discount + totals.deliveryCharge + totals.tax;

    if (appliedCoupon) finalAmount -= appliedCoupon.discount;

    const orderId = new mongoose.Types.ObjectId();
    let hold = null;

    // -------------------------------
    // Wallet HOLD
    // -------------------------------
    if (paymentMethod === "wallet") {
      const wallet = await findWalletByUserId(userId, session);
      if (!wallet || wallet.balance - wallet.holdBalance < finalAmount) {
        throw { status: 400, message: "Insufficient wallet balance" };
      }

      // Increment hold
      await updateWalletHoldBalance(userId, finalAmount, session);

      // Create hold record
      const [holdRecord] = await createHoldRecord(
        {
          userId,
          walletId: wallet._id,
          orderId,
          amount: finalAmount,
          status: "HELD",
        },
        session
      );

      hold = holdRecord;

      // Ledger for hold
      await createLedgerEntry(
        {
          walletId: wallet._id,
          userId,
          amount: -finalAmount,
          type: "HOLD",
          referenceId: orderId,
          note: "Reserved for order",
        },
        session
      );
    }

    // -------------------------------
    // Create ORDER
    // -------------------------------
    const order = await createOrder(
      {
        _id: orderId,
        userId,
        addressId,
        orderedItems,
        finalAmount,
        paymentMethod,
        paymentStatus: paymentMethod === "wallet" ? "Paid" : "Pending",
      },
      session
    );

    // -------------------------------
    // Wallet CAPTURE
    // -------------------------------
    if (paymentMethod === "wallet") {
      try {
        // Deduct from wallet
        await updateWalletHoldBalance(userId, -finalAmount, session);
        await updateWalletBalance(userId, -finalAmount, session);

        // Update hold record
        await updateHoldStatus(hold._id, "CAPTURED", session);

        // Ledger entry
        await createLedgerEntry(
          {
            walletId: hold.walletId,
            userId,
            amount: -finalAmount,
            type: "DEBIT",
            referenceId: orderId,
            note: "Order payment captured",
          },
          session
        );
      } catch (err) {
        // RELEASE
        await updateWalletHoldBalance(userId, -finalAmount, session);
        await updateHoldStatus(hold._id, "RELEASED", session);

        await createLedgerEntry(
          {
            walletId: hold.walletId,
            userId,
            amount: finalAmount,
            type: "RELEASE",
            referenceId: orderId,
            note: "Order payment failed, released hold",
          },
          session
        );

        // Restore stock
        for (let item of orderedItems) {
          await incrementProductStock(item.productId, item.quantity, session);
          await incrementVariantStock(item.variantId, item.quantity, session);
        }

        throw { status: 400, message: "Wallet payment failed" };
      }
    }

    // -------------------------------
    // Clear Cart
    // -------------------------------
    await deleteUserCart(userId);

    // -------------------------------
    // Coupon Usage
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
      orderId: order._id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return {
      status: error.status || 500,
      success: false,
      message: error.message || "Something went wrong",
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
