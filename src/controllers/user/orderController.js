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
import PDFDocument from "pdfkit";

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

export const loadOrderSuccess = async (req, res) => {
  const order = await Order.find({ orderId: req.params.id })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
  res.render("user/orderSuccess", { pageTitle: "Success", order: order[0] });
};

export const laodMyOrders = async (req, res) => {
  const user = await userModel.findById(req.session.user);
  const orders = await Order.find()
    .sort({ createdAt: -1 })
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
  res.render("user/myOrders", {
    pageTitle: "My Orders",
    pageJs: "myOrder",
    user,
    orders,
  });
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

export const loadTrackOrder = async (req, res) => {
  const id = req.params.id;
  const order = await Order.findById(id)
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
  res.render("user/trackOrder", { pageTitle: "My Orders", order });
};

export const loadOrderDetails = async (req, res) => {
  const id = req.params.id;
  const order = await Order.findById(id)
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
  res.render("user/orderDetails", { pageTitle: "My Orders", order });
};

export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({orderId})
      .populate("orderedItems.productId")
      .populate("orderedItems.variantId");

    if (!order) return res.status(404).send("Order not found");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order.orderId}.pdf`
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // --- Header ---
    doc.fontSize(22).text("INVOICE", { align: "center" });
    doc.moveDown(1);

    // --- Order Info ---
    doc.fontSize(12);
    doc.text(`Order ID: ${order.orderId}`);
    doc.text(`Order Date: ${order.createdAt.toDateString()}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();

    // --- Shipping Address ---
    doc.fontSize(14).text("Shipping Address", { underline: true });
    doc.moveDown(0.5);

    const A = order.shippingAddress;

    doc.fontSize(12).text(`${A.fullName}`);
    doc.text(`${A.address1}${A.address2 ? ", " + A.address2 : ""}`);
    doc.text(`${A.city}, ${A.state} - ${A.pincode}`);
    doc.text(`${A.country}`);
    doc.text(`Phone: ${A.phone}`);
    doc.moveDown(1);

    // --- Items List ---
    doc.fontSize(14).text("Order Items", { underline: true });
    doc.moveDown(0.5);

    order.orderedItems.forEach((item, i) => {
      doc.fontSize(12).text(`${i + 1}. ${item.productId.name}`);

      // Variant fields (if available)
      let variants = [];
      if (item.variantId.colour) variants.push(`Colour: ${item.variantId.colour}`);
      if (item.variantId.ram) variants.push(`RAM: ${item.variantId.ram}`);
      if (item.variantId.storage) variants.push(`Storage: ${item.variantId.storage}`);

      doc.text(variants.join(" | "));

      doc.text(`Qty: ${item.quantity}`);
      doc.text(`Price: ₹${item.price}`);
      doc.text(`Total: ₹${item.price * item.quantity}`);

      // Item Status
      doc.text(`Status: ${item.itemStatus}`);

      // Reason
      if (item.reason) doc.text(`Reason: ${item.reason}`);

      // Admin Note
      if (item.adminNote) doc.text(`Admin Note: ${item.adminNote}`);

      doc.moveDown();
    });

    // --- Price Breakdown ---
    doc.moveDown(1);
    doc.fontSize(14).text("Price Summary", { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12).text(`Subtotal: ₹${order.subtotal}`);
    doc.text(`Discount: -₹${order.discount}`);
    doc.text(`Delivery Charge: ₹${order.deliveryCharge}`);
    doc.moveDown();

    doc.fontSize(16).text(`Final Amount: ₹${order.finalAmount}`, {
      align: "right",
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to generate invoice");
  }
};
