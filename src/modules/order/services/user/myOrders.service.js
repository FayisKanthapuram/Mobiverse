import {
  findOrderByOrderId,
  findOrderByOrderIdWithUser,
  findUserOrders,
  saveOrder,
} from "../../repo/order.repo.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { OrderItemsSchema } from "../../order.validator.js";
import { incrementVariantStock } from "../../../product/repo/variant.repo.js";
import {
  findUserById,
  updateUserWalletBalance,
} from "../../../user/user.repo.js";
import {
  findWalletByUserId,
  updateWalletBalanceAndCredit,
} from "../../../wallet/repo/wallet.repo.js";
import { createLedgerEntry } from "../../../wallet/repo/wallet.ledger.repo.js";
import { OrderMessages } from "../../../../shared/constants/messages/orderMessages.js";
import { calculateOrderPaymentStatus, calculateOrderStatus } from "../../order.helper.js";

export const loadMyOrdersService = async (userId, queryParams) => {
  const status = queryParams.status || "";
  const search = queryParams.searchOrder || "";
  const currentPage = parseInt(queryParams.page) || 1;

  const limit = 3;
  const skip = (currentPage - 1) * limit;

  const orderQuery = { userId };

  if (status) {
    orderQuery.orderStatus = status;
  }

  const user = await findUserById(userId);

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
  const { error } = OrderItemsSchema.validate(body);
  if (error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: error.details[0].message,
    };
  }

  const { itemIds, reason, comments } = body;

  const order = await findOrderByOrderId(orderId);

  if (!order) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: OrderMessages.ORDER_NOT_FOUND,
    };
  }

  let refundAmount = 0;

  for (const item of order.orderedItems) {
    const isSelected = itemIds.includes(item._id.toString());

    if (isSelected) {
      // Restore Stock
      await incrementVariantStock(item.variantId, item.quantity);

      // Update Item
      item.itemStatus = "Cancelled";
      item.paymentStatus =
        order.paymentMethod === "cod" ? "Cancelled" : "Refunded";
      item.reason = `${reason}, ${comments}`;
      item.itemTimeline.cancelledAt = Date.now();
      refundAmount += item.price - item.couponShare - item.offer;
    }
  }

  if (order.paymentMethod !== "cod") {
    await updateWalletBalanceAndCredit(order.userId, refundAmount);
    const wallet = await findWalletByUserId(order.userId);
    await updateUserWalletBalance(order.userId, wallet.balance);
    await createLedgerEntry({
      walletId: wallet._id,
      userId: order.userId,
      amount: refundAmount,
      type: "CREDIT",
      referenceId: order.orderId,
      note: `Refund of ₹${refundAmount} has been processed for the cancelled order: ${order.orderId}`,
      balanceAfter: wallet.balance,
    });
  }

  order.orderStatus = calculateOrderStatus(order.orderedItems);
  order.paymentStatus=calculateOrderPaymentStatus(order.orderedItems);

  await saveOrder(order);

  return {
    status: HttpStatus.OK,
    success: true,
    message: OrderMessages.ORDER_CANCELLED_SUCCESSFULLY,
  };
};

export const returnOrderItemsService = async (orderId, body) => {
  // 1. Validate request
  const { error } = OrderItemsSchema.validate(body);
  if (error) {
    return {
      status: HttpStatus.BAD_REQUEST,
      success: false,
      message: error.details[0].message,
    };
  }

  const { itemIds, reason, comments } = body;

  // 2. Fetch order
  const order = await findOrderByOrderId(orderId);

  if (!order) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: OrderMessages.ORDER_NOT_FOUND,
    };
  }

  // 3. Update item statuses

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

  // 4. Update order status
  order.orderStatus = calculateOrderStatus(order.orderedItems);

  // 5. Save order

  await saveOrder(order);

  return {
    status: HttpStatus.OK,
    success: true,
    message: OrderMessages.RETURN_REQUEST_SUBMITTED,
  };
};

export const loadOrderDetailsService = async (orderId) => {
  const order = await findOrderByOrderIdWithUser(orderId);

  if (!order) {
    const err = new Error(OrderMessages.ORDER_NOT_FOUND);
    err.status = 404;
    throw err;
  }

  return order;
};

export const loadInvoiceService = async (orderId) => {
  const order = await findOrderByOrderIdWithUser(orderId);

  if (!order) {
    const err = new Error(OrderMessages.ORDER_NOT_FOUND);
    err.status = 404;
    throw err;
  }

  // prepare any extra invoice calculations here if needed (tax breakdown, formatted amounts)
  return {
    order,
    user: order.userId,
  };
};
