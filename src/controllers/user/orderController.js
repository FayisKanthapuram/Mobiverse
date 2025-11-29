import { HttpStatus } from "../../constants/statusCode.js";
import Order from "../../models/orderModel.js";
import {
  OrderItemsSchema,
} from "../../validators/OrderValidator.js";
import userModel from "../../models/userModel.js";
import variantModel from "../../models/variantModel.js";
import productModel from "../../models/productModel.js";
import { placeOrderService } from "../../services/order.service.js";

export const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user;
    const body = req.body;

    const result = await placeOrderService(userId, body);

    return res.status(result.status).json(result);
  } catch (err) {
    console.log("Order Error:", err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while placing the order.",
    });
  }
};

export const loadOrderSuccess = async (req, res, next) => {
  try {
    const order = await Order.find({ orderId: req.params.id })
      .populate("orderedItems.productId")
      .populate("orderedItems.variantId");
    res.render("user/orderSuccess", { pageTitle: "Success", order: order[0] });
  } catch (error) {
    next(error);
  }
};

export const laodMyOrders = async (req, res, next) => {
  try {
    const status = req.query.status || "";
    const search = req.query.searchOrder || "";
    const currentPage = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (currentPage - 1) * limit;

    let query = { userId: req.session.user };

    if (status) {
      query.orderStatus = status;
    }

    const user = await userModel.findById(req.session.user);

    let orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("orderedItems.productId")
      .populate("orderedItems.variantId");
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
    orders = orders.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.render("user/myOrders", {
      pageTitle: "My Orders",
      pageJs: "myOrder",
      user,
      orders,
      query: req.query,
      currentPage,
      totalDocuments,
      limit,
      totalPages,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderItems = async (req, res) => {
  try {
    const { error } = OrderItemsSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { id } = req.params;

    const { itemIds, reason, comments } = req.body;
    const order = await Order.findById(id);

    let isAllReturned = true;
    for (const item of order.orderedItems) {
      if (itemIds.includes(item._id.toString())) {
        const variant = await variantModel.findById(item.variantId);
        const product = await productModel.findById(item.productId);

        // Increase stock back
        product.totalStock += item.quantity;
        variant.stock += item.quantity;

        await product.save();
        await variant.save();

        // Update item fields
        item.itemStatus = "Cancelled";
        item.reason = `${reason}, ${comments}`;
      }

      // Check remaining non-cancelled items
      if (item.itemStatus !== "Cancelled") {
        isAllReturned = false;
      }
    }

    if (isAllReturned) {
      order.orderStatus = "Cancelled";

      order.statusTimeline.cancelledAt = Date.now();
    } else order.orderStatus = "Partially Cancelled";

    await order.save();

    return res.status(HttpStatus.OK).json({
      success: true,
      message: "Order Cancelled successfully",
    });
  } catch (error) {
    console.log("Order Error:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while cancelling the order.",
    });
  }
};

export const returnOrderItems = async (req, res) => {
  try {
    const { error } = OrderItemsSchema.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { id } = req.params;

    const { itemIds, reason, comments } = req.body;
    const order = await Order.findById(id);

    order.orderedItems.forEach((item) => {
      if (itemIds.includes(item._id.toString())) {
        item.itemStatus = "ReturnRequested";
        item.reason = `${reason}, ${comments}`;
      }
    });

    order.orderStatus = "Partially Returned";

    await order.save();

    return res.status(HttpStatus.OK).json({
      success: true,
      message: "Order returned successfully",
    });
  } catch (error) {
    console.log("Order Error:", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while cancelling the order.",
    });
  }
};

export const loadTrackOrder = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id)
      .populate("orderedItems.productId")
      .populate("orderedItems.variantId");
    res.render("user/trackOrder", { pageTitle: "My Orders", order });
  } catch (error) {
    next(error);
  }
};

export const loadOrderDetails = async (req, res, next) => {
  try {
    const id = req.params.id;
    const order = await Order.findById(id)
      .populate("orderedItems.productId")
      .populate("orderedItems.variantId");
    res.render("user/orderDetails", { pageTitle: "My Orders", order });
  } catch (error) {
    next(error);
  }
};

export const downloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;

    const order = await Order.findOne({ orderId })
      .populate("orderedItems.productId")
      .populate("orderedItems.variantId")
      .populate("userId");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    res.render("user/invoice", {
      layout: false,
      order,
      user: order.userId,
    });
  } catch (error) {
    next(error);
  }
};
