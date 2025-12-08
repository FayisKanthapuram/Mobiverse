import { findOrderById, findOrderByIdWithItems, findOrderByOrderIdWithUser, findUserOrders, saveOrder } from "../../order.repo.js";
import { HttpStatus } from "../../../../shared/constants/statusCode.js";
import { OrderItemsSchema } from "../../order.validator.js";
import { incrementVariantStock } from "../../../product/repo/variant.repo.js";
import { incrementProductStock } from "../../../product/repo/product.repo.js";
import { findUserById } from "../../../user/user.repo.js";

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

    orders = orders.filter((order) =>
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

  const order = await findOrderById(orderId);

  if (!order) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Order not found.",
    };
  }

  let isAllCancelled = true;

  for (const item of order.orderedItems) {
    const isSelected = itemIds.includes(item._id.toString());

    if (isSelected) {
      // Restore Stock
      await incrementProductStock(item.productId, item.quantity);
      await incrementVariantStock(item.variantId, item.quantity);

      // Update Item
      item.itemStatus = "Cancelled";
      item.reason = `${reason}, ${comments}`;
    }

    // Check if any item remains active
    if (item.itemStatus !== "Cancelled") {
      isAllCancelled = false;
    }
  }

  // 4. Update Order Status
  if (isAllCancelled) {
    order.orderStatus = "Cancelled";
    order.statusTimeline.cancelledAt = Date.now();
  } else {
    order.orderStatus = "Partially Cancelled";
  }

  await saveOrder(order);

  return {
    status: HttpStatus.OK,
    success: true,
    message: "Order cancelled successfully",
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
  const order = await findOrderById(orderId);

  if (!order) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Order not found.",
    };
  }

  
  // 3. Update item statuses
  
  let anyItemUpdated = false;

  for (const item of order.orderedItems) {
    if (itemIds.includes(item._id.toString())) {
      item.itemStatus = "ReturnRequested";
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
  
  order.orderStatus = "Partially Returned";

  
  // 5. Save order
  
  await saveOrder(order);

  return {
    status: HttpStatus.OK,
    success: true,
    message: "Return request submitted successfully.",
  };
};

export const loadOrderDetailsService = async (orderId) => {
  const order = await findOrderByIdWithItems(orderId);

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  return order;
};

export const loadInvoiceService = async (orderId) => {
  const order = await findOrderByOrderIdWithUser(orderId);

  if (!order) {
    const err = new Error("Order not found");
    err.status = 404;
    throw err;
  }

  // prepare any extra invoice calculations here if needed (tax breakdown, formatted amounts)
  return {
    order,
    user: order.userId,
  };
};