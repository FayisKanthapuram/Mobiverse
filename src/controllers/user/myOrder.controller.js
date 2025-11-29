import { cancelOrderItemsService, loadInvoiceService, loadMyOrdersService, loadOrderDetailsService, returnOrderItemsService } from "../../services/myOrders.service.js";


export const loadMyOrders = async (req, res, next) => {
  try {
    const userId = req.session.user;

    const data = await loadMyOrdersService(userId, req.query);

    return res.render("user/myOrders", {
      pageTitle: "My Orders",
      pageJs: "myOrder",
      user: data.user,
      orders: data.orders,
      query: req.query,

      currentPage: data.pagination.currentPage,
      totalDocuments: data.pagination.totalDocuments,
      totalPages: data.pagination.totalPages,
      limit: data.pagination.limit,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderItems = async (req, res) => {
  try {
    const orderId = req.params.id;
    const body = req.body;

    const result = await cancelOrderItemsService(orderId, body);

    return res.status(result.status).json(result);

  } catch (error) {
    console.log("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while cancelling the order.",
    });
  }
};

export const returnOrderItems = async (req, res) => {
  try {
    const orderId = req.params.id;
    const body = req.body;

    const result = await returnOrderItemsService(orderId, body);

    return res.status(result.status).json(result);

  } catch (error) {
    console.log("Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while returning the order.",
    });
  }
};


export const loadTrackOrder = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderDetailsService(orderId);

    return res.render("user/trackOrder", {
      pageTitle: "My Orders",
      order,
    });

  } catch (error) {
    next(error);
  }
};

export const loadOrderDetails = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await loadOrderDetailsService(orderId);

    return res.render("user/orderDetails", {
      pageTitle: "My Orders",
      order,
    });

  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    const { order, user } = await loadInvoiceService(orderId);

    // Render invoice HTML (layout: false so it is a clean document)
    return res.render("user/invoice", {
      layout: false,
      order,
      user,
    });
  } catch (error) {
    // service throws a 404-error object when not found, pass to next
    next(error);
  }
};