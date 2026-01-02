import { HttpStatus } from "../../shared/constants/statusCode.js";
import {
  addToCartService,
  loadCartService,
  updateCartItemService,
  deleteCartItemService, // Add this line
} from "./cart.service.js";
import { AppError } from "../../shared/utils/app.error.js";
import { CartMessages } from "../../shared/constants/messages/cartMessages.js";
import { CheckoutMessages } from "../../shared/constants/messages/checkoutMessages.js";

// Cart controller - handle user cart HTTP endpoints

// Render cart page
export const loadCart = async (req, res) => {
  if (req.session.appliedCoupon) req.session.appliedCoupon = null;

  const data = await loadCartService(req?.user?._id);
  req.session.cartCount = data.cartCount;

  res.status(HttpStatus.OK).render("user/cart", {
    pageTitle: "Cart",
    pageJs: "cart",
    cart: data.cart,
    relatedProducts: data.relatedProducts,
    isAdjested:data.cart.hasAdjustedItem,
  });
};

// Add item to cart
export const addToCart = async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    throw new AppError(CartMessages.PLEASE_LOGIN, HttpStatus.UNAUTHORIZED);
  }

  if (req.user.isBlocked) {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("user.sid");

        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: CartMessages.ACCOUNT_BLOCKED,
          redirect: "/login",
        });
      });
    });
    return;
  }

  const result = await addToCartService(req?.user?._id, req.body);
  req.session.cartCount = result.cartCount;
  req.session.wishlistCount = result.wishlistCount;

  res.status(result.status).json(result);
};

// Update quantity of a cart item
export const updateCartItem = async (req, res) => {
  const itemId = req.params.id;
  const userId = req?.user?._id;

  const result = await updateCartItemService(itemId, userId, req.body);
  res.status(result.status).json(result);
};

// Remove an item from the cart
export const deleteCartItem = async (req, res) => {
  const id = req.params.id;

  const result = await deleteCartItemService(id, req.user._id); // Use the new service
  req.session.cartCount = result.cartCount;

  res.status(result.status).json(result);
};
