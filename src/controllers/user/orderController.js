import { HttpStatus } from "../../constants/statusCode.js";
import addressModel from "../../models/addressModel.js";
import Order from "../../models/orderModel.js";
import cartModel from "../../models/cartModel.js";
import {
  calculateCartTotals,
  getCartItems,
} from "../../services/cartServices.js";
import { orderValidation } from "../../validators/placeOrderValidator.js";
import userModel from "../../models/userModel.js";

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

    // Check Address Exists
    const address = await addressModel.findById(addressId).lean();
    if (!address) {
      return res.status(HttpStatus.NOT_FOUND).json({
        success: false,
        message: "The selected address was not found.",
      });
    }

    // Get Cart Items
    const items = await getCartItems(userId);
    if (!items.length) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    // Calculate Totals
    const cartTotals = await calculateCartTotals(items);

    // Build Ordered Items Array
    const orderedItems = items.map((item) => ({
      productId: item.productId._id,
      variantId: item.variantId._id,
      quantity: item.quantity,
      price: item.variantId.salePrice,
    }));

    // Embed Address into Order
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

    // Set Payment Status
    let paymentStatus = "Pending";
    if (paymentMethod === "razorpay"||paymentMethod === "wallet") paymentStatus = "Paid";

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

    // Clear Cart
    await cartModel.deleteMany({ userId });

    // Response
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
  console.log(order[0]);
  res.render("user/orderSuccess", { pageTitle: "Success", order: order[0] });
};

export const laodMyOrders = async (req, res) => {
  const user = await userModel.findById(req.session.user);
  const orders = await Order.find()
    .populate("orderedItems.productId")
    .populate("orderedItems.variantId");
  res.render("user/myOrders", {pageTitle:'My Orders', user, orders });
};
