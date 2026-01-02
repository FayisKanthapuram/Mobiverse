import {
  handleReturnRequestService,
  loadOrderDetailsService,
  loadOrdersService,
  markItemReturnedService,
  updateItemStatusService,
} from "../services/index.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { OrderMessages } from "../../../shared/constants/messages/orderMessages.js";
import Order from "../models/order.model.js";

/* ----------------------------------------------------
   LOAD ORDERS
---------------------------------------------------- */
export const loadOrders = async (req, res) => {
  const data = await loadOrdersService(req.query);

  res.status(HttpStatus.OK).render("admin/orders/orders", {
    pageTitle: "Orders",
    pageJs: "orders",
    analytics: data.analytics,
    orders: data.orders,
    currentPage: data.pagination.currentPage,
    totalPages: data.pagination.totalPages,
    totalOrders: data.pagination.totalOrders,
    limit: data.pagination.limit,
    sortFilter: data.filters.sortFilter,
    statusFilter: data.filters.statusFilter,
    paymentStatusFilter: data.filters.paymentStatusFilter,
    searchQuery: data.filters.searchQuery,
    returnRequested:data.filters.returnRequested,
  });
};


/* ----------------------------------------------------
   LOAD ORDER DETAILS
---------------------------------------------------- */
export const loadOrderDetails = async (req, res) => {
  const order = await loadOrderDetailsService(req.params.orderId);

  res.status(HttpStatus.OK).render("admin/orders/orderDetails", {
    pageTitle: "Orders",
    pageJs: "orders",
    order,
  });
};

export const updateItemStatus = async (req, res) => {
  const { orderId, itemId } = req.params;
  const { status } = req.body;

  const order = await updateItemStatusService(orderId, itemId, status);

  res.status(HttpStatus.OK).json({
    success: true,
    message: "Item status updated successfully",
    order,
  });
};


/* ----------------------------------------------------
   HANDLE RETURN REQUEST (APPROVE / REJECT)
---------------------------------------------------- */
export const handleReturnRequest = async (req, res) => {
  const order = await handleReturnRequestService(req.params.id, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: OrderMessages.RETURN_REQUEST_ACTION.replace("{action}", req.body.action),
    order,
  });
};

/* ----------------------------------------------------
   MARK ITEM RETURNED
---------------------------------------------------- */
export const markItemReturned = async (req, res) => {
  const order = await markItemReturnedService(req.params.id, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: OrderMessages.ITEM_MARKED_RETURNED,
    order,
  });
};
