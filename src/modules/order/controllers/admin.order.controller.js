import { handleReturnRequestService, loadOrderDetailsService, loadOrdersService, markItemReturnedService, updateOrderStatusService } from "../services/index.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const loadOrders = async (req, res, next) => {
  try {
    const data = await loadOrdersService(req.query);
    res.status(HttpStatus.OK).render("admin/orders/orders", {
      pageTitle: "Orders",
      pageCss: "orders",
      pageJs: "orders",

      // Data from service
      analytics: data.analytics,
      orders: data.orders,

      // Pagination
      currentPage: data.pagination.currentPage,
      totalPages: data.pagination.totalPages,
      totalOrders: data.pagination.totalOrders,
      limit: data.pagination.limit,

      // Filters
      sortFilter: data.filters.sortFilter,
      statusFilter: data.filters.statusFilter,
      paymentStatusFilter: data.filters.paymentStatusFilter,
      searchQuery: data.filters.searchQuery,
    });
  } catch (error) {
    next(error);
  }
};

export const loadOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderDetailsService(orderId);

    res.status(HttpStatus.OK).render("admin/orders/orderDetails", {
      pageTitle: "Orders",
      pageJs: "orderDetails",
      pageCss: "orderDetails",
      order,
    });

  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;

    const updatedOrder = await updateOrderStatusService(orderId, status);

    res.status(HttpStatus.OK).json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.log("Order Status Update Error:", error);

    res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while updating order status",
    });
  }
};

// Handle Return Request (Approve / Reject)
export const handleReturnRequest = async (req, res) => {
  try {
    const orderId = req.params.id;

    const updatedOrder = await handleReturnRequestService(orderId, req.body);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: `Return request ${req.body.action}d successfully`,
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Return Request Error:", error);

    return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while processing return request",
    });
  }
};


// Mark Item Returned (Admin confirms receipt of returned item)
export const markItemReturned = async (req, res) => {
  try {
    const orderId = req.params.id;

    const updatedOrder = await markItemReturnedService(orderId, req.body);

    return res.status(HttpStatus.OK).json({
      success: true,
      message: "Item marked returned",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Mark Item Returned Error:", error);

    return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Server error while marking item returned",
    });
  }
};