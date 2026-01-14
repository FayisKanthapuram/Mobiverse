import {
  findOrderByOrderId,
  findOrderByOrderIdWithDeliveredItems,
  findOrderByOrderIdWithUser,
  findUserOrders,
  saveOrder,
} from "../../repo/order.repo.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { AppError } from "../../../../shared/utils/app.error.js";
import { OrderItemsSchema } from "../../order.validator.js";
import { incrementVariantStock } from "../../../product/repo/variant.repo.js";
import { updateUserWalletBalance } from "../../../user/user.repo.js";
import {
  findWalletByUserId,
  updateWalletBalanceAndCredit,
} from "../../../wallet/repo/wallet.repo.js";
import { createLedgerEntry } from "../../../wallet/repo/wallet.ledger.repo.js";
import { OrderMessages } from "../../../../shared/constants/messages/orderMessages.js";
import {
  calculateOrderPaymentStatus,
  calculateOrderStatus,
} from "../../order.helper.js";
import mongoose from "mongoose";

// My orders service - handle user order operations
// Load user orders with filtering
export const loadMyOrdersService = async (user, queryParams) => {
  const status = queryParams.status || "";
  const search = queryParams.searchOrder || "";
  const currentPage = parseInt(queryParams.page) || 1;

  const limit = 3;
  const skip = (currentPage - 1) * limit;

  const orderQuery = { userId: user._id };

  if (status) {
    orderQuery.orderStatus = status;
  }

  let orders = await findUserOrders(orderQuery);

  if (search) {
    const s = search.toLowerCase();

    orders = orders.filter(
      (order) =>
        order.orderId?.toLowerCase().includes(s) ||
        order.orderedItems.some((item) =>
          item.productId?.name?.toLowerCase().includes(s)
        )
    );
  }

  const totalDocuments = orders.length;
  const totalPages = Math.ceil(totalDocuments / limit);

  const paginatedOrders = orders.slice(skip, skip + limit);

  return {
    user,
    orders: paginatedOrders,
    pagination: {
      currentPage,
      totalDocuments,
      totalPages,
      limit,
    },
  };
};

export const cancelOrderItemsService = async (orderId, body) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error } = OrderItemsSchema.validate(body);
    if (error) {
      return {
        status: HttpStatus.BAD_REQUEST,
        success: false,
        message: error.details[0].message,
      };
    }

    const { itemIds, reason, comments } = body;
    const itemIdSet = new Set(itemIds);

    const order = await findOrderByOrderId(orderId).session(session);
    if (!order) {
      return {
        status: HttpStatus.NOT_FOUND,
        success: false,
        message: OrderMessages.ORDER_NOT_FOUND,
      };
    }

    let refundAmount = 0;
    let newlyCancelledCount = 0;

    for (const item of order.orderedItems) {
      if (!itemIdSet.has(item._id.toString())) continue;

      // 🔐 CRITICAL: prevent double cancel
      if (item.itemStatus === "Cancelled") continue;

      newlyCancelledCount++;

      await incrementVariantStock(item.variantId, item.quantity, session);

      const discount = (item.couponShare || 0) + (item.offer || 0);

      refundAmount += (item.price - discount) * item.quantity;

      item.itemStatus = "Cancelled";
      item.paymentStatus =
        order.paymentMethod === "cod" ? "Cancelled" : "Refunded";

      item.reason = comments ? `${reason}, ${comments}` : reason;

      item.itemTimeline = {
        ...item.itemTimeline,
        cancelledAt: new Date(),
      };
    }

    // 🚫 Nothing new was cancelled
    if (newlyCancelledCount === 0) {
      await session.abortTransaction();
      session.endSession();

      return {
        status: HttpStatus.CONFLICT,
        success: false,
        message: "Selected items are already cancelled",
      };
    }

    // 💳 Wallet handling
    if (order.paymentMethod !== "cod" && refundAmount > 0) {
      await updateWalletBalanceAndCredit(order.userId, refundAmount, session);

      const wallet = await findWalletByUserId(order.userId, session);

      await updateUserWalletBalance(order.userId, wallet.balance, session);

      await createLedgerEntry(
        {
          walletId: wallet._id,
          userId: order.userId,
          amount: refundAmount,
          type: "CREDIT",
          referenceId: order.orderId,
          note: `Refund of ₹${refundAmount} processed for cancelled items in order ${order.orderId}`,
          balanceAfter: wallet.balance,
        },
        session
      );
    }

    order.orderStatus = calculateOrderStatus(order.orderedItems);
    order.paymentStatus = calculateOrderPaymentStatus(order.orderedItems);

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      status: HttpStatus.OK,
      success: true,
      message: OrderMessages.ORDER_CANCELLED_SUCCESSFULLY,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

// Return ordered items with reason
export const returnOrderItemsService = async (orderId, body) => {
  // Validate request body
  const { error } = OrderItemsSchema.validate(body);
  if (error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: error.details[0].message,
    };
  }

  const { itemIds, reason, comments } = body;

  // Fetch order by ID
  const order = await findOrderByOrderId(orderId);

  if (!order) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: OrderMessages.ORDER_NOT_FOUND,
    };
  }

  // Mark items as return requested
  let anyItemUpdated = false;

  for (const item of order.orderedItems) {
    if (itemIds.includes(item._id.toString())) {
      item.itemStatus = "ReturnRequested";
      item.itemTimeline.returnRequestedAt = Date.now();
      item.reason = `${reason}, ${comments}`;
      anyItemUpdated = true;
    }
  }

  if (!anyItemUpdated) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: "No valid items found to return.",
    };
  }

  // Recalculate order status based on item states
  order.orderStatus = calculateOrderStatus(order.orderedItems);

  // Save updated order to database
  await saveOrder(order);

  return {
    status: HttpStatus.OK,
    success: true,
    message: OrderMessages.RETURN_REQUEST_SUBMITTED,
  };
};

// Load order details for user view
export const loadOrderDetailsService = async (orderId) => {
  const order = await findOrderByOrderIdWithUser(orderId);

  if (!order) {
    throw new AppError(OrderMessages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return order;
};

// Load and calculate invoice with subtotal and discount breakdown
export const loadInvoiceService = async (orderId) => {
  const output = await findOrderByOrderIdWithDeliveredItems(orderId);
  const orders = output[0];
  // Calculate subtotal and discount
  orders.subtotal = 0;
  orders.discount = 0;
  for (let order of orders.orderedItems) {
    orders.subtotal += order.regularPrice * order.quantity;
    orders.discount +=
      (order.offer + order.regularPrice - order.price) * order.quantity;
  }

  orders.finalAmount = orders.subtotal - orders.discount;

  if (!orders) {
    throw new AppError(OrderMessages.ORDER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return {
    order: orders,
    user: orders.userId,
  };
};
