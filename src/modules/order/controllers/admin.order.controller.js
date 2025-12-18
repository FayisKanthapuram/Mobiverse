import {
  handleReturnRequestService,
  loadOrderDetailsService,
  loadOrdersService,
  markItemReturnedService,
  updateOrderStatusService,
} from "../services/index.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { OrderMessages } from "../../../shared/constants/messages/orderMessages.js";

/* ----------------------------------------------------
   LOAD ORDERS
---------------------------------------------------- */
export const loadOrders = async (req, res) => {
  const data = await loadOrdersService(req.query);

  res.status(HttpStatus.OK).render("admin/orders/orders", {
    pageTitle: "Orders",
    // pageCss: "orders",
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
  });
};

/* ----------------------------------------------------
   LOAD ORDER DETAILS
---------------------------------------------------- */
export const loadOrderDetails = async (req, res) => {
  const order = await loadOrderDetailsService(req.params.id);

  res.status(HttpStatus.OK).render("admin/orders/orderDetails", {
    pageTitle: "Orders",
    pageJs: "orders",
    order,
  });
};

/* ----------------------------------------------------
   UPDATE ORDER STATUS
---------------------------------------------------- */
export const updateOrderStatus = async (req, res) => {
  const order = await updateOrderStatusService(req.params.id, req.body.status);

  res.status(HttpStatus.OK).json({
    success: true,
    message: OrderMessages.ORDER_STATUS_UPDATED,
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
