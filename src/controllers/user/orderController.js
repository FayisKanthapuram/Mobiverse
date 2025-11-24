import { HttpStatus } from "../../constants/statusCode.js";
import addressModel from "../../models/addressModel.js";
import Order from "../../models/orderModel.js";
import cartModel from "../../models/cartModel.js";
import {
  calculateCartTotals,
  getCartItems,
} from "../../services/cartServices.js";
import {
  OrderItemsSchema,
  orderValidation,
} from "../../validators/OrderValidator.js";
import userModel from "../../models/userModel.js";
import variantModel from "../../models/variantModel.js";
import productModel from "../../models/productModel.js";
export const placeOrder = async (req, res) => {
  try {
    // Validate Input
    const { error } = orderValidation.validate(req.body);
    if (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const userId = req.session.user;
    const { addressId, paymentMethod } = req.body;

    const address = await addressModel.findById(addressId).lean();
    if (!address) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "The selected address was not found.",
      });
    }

    const items = await getCartItems(userId);
    if (!items.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    const cartTotals = await calculateCartTotals(items);

    items.forEach(async (item) => {
      const variant = await variantModel.findById(item.variantId._id);
      const product = await productModel.findById(item.productId._id);
      product.totalStock = product.totalStock - item.quantity;
      variant.stock = variant.stock - item.quantity;
      await product.save();
      await variant.save();
    });

    const orderedItems = items.map((item) => ({
      productId: item.productId._id,
      variantId: item.variantId._id,
      quantity: item.quantity,
      price: item.variantId.salePrice,
    }));

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

    let paymentStatus = "Pending";
    if (paymentMethod === "razorpay" || paymentMethod === "wallet")
      paymentStatus = "Paid";

    // Create Order
    const order = await Order.create({
      userId,
      addressId,

      orderedItems,
      shippingAddress,

      paymentMethod,
      paymentStatus,

      subtotal: cartTotals.subtotal,
      deliveryCharge: cartTotals.deliveryCharge,
      tax: cartTotals.tax,
      discount: cartTotals.discount,
      finalAmount:
        cartTotals.subtotal -
        cartTotals.discount +
        cartTotals.deliveryCharge +
        cartTotals.tax,

      expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    });

    await cartModel.deleteMany({ userId });

    return res.status(HttpStatus.OK).json({
      success: true,
      message: "Order placed successfully",
      orderId: order.orderId,
    });
  } catch (err) {
    console.log("Order Error:", err);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
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
    const search = req.query.search || "";

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

    res.render("user/myOrders", {
      pageTitle: "My Orders",
      pageJs: "myOrder",
      user,
      orders,
      query: req.query,
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

export const loadOrderDetails = async (req, res,next) => {
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

export const downloadInvoice = async (req, res ,next) => {
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
