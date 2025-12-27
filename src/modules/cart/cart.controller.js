import { HttpStatus } from "../../shared/constants/statusCode.js";
import {
  addToCartService,
  loadCartService,
  updateCartItemService,
  deleteCartItemService, // Add this line
} from "./cart.service.js";
import { AppError } from "../../shared/utils/app.error.js";

/* ----------------------------------------------------
   LOAD CART
---------------------------------------------------- */
export const loadCart = async (req, res) => {
  if (req.session.appliedCoupon) req.session.appliedCoupon = null;

  const data = await loadCartService(req?.user?._id);
  req.session.cartCount = data.cartCount;

  res.status(HttpStatus.OK).render("user/cart", {
    pageTitle: "Cart",
    pageJs: "cart",
    cart: data.cart,
    relatedProducts: data.relatedProducts,
  });
};

/* ----------------------------------------------------
   ADD TO CART
---------------------------------------------------- */
export const addToCart = async (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    throw new AppError(
      "Please log in to add products to your cart.",
      HttpStatus.UNAUTHORIZED
    );
  }

  if (req.user.isBlocked) {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("user.sid");

        return res.status(HttpStatus.FORBIDDEN).json({
          success: false,
          message: "Your account has been blocked. Please contact support.",
          redirect: "/login",
        });
      });
    });
    return;
  }

  const result = await addToCartService(req?.user?._id, req.body);
  req.session.cartCount = result.cartCount;
  req.session.wishlistCount=result.wishlistCount;

  res.status(result.status).json(result);
};

/* ----------------------------------------------------
   UPDATE CART ITEM
---------------------------------------------------- */
export const updateCartItem = async (req, res) => {
  const itemId = req.params.id;
  const userId = req?.user?._id;

  const result = await updateCartItemService(itemId, userId, req.body);
  res.status(result.status).json(result);
};

/* ----------------------------------------------------
   DELETE CART ITEM
---------------------------------------------------- */
export const deleteCartItem = async (req, res) => {
  const id = req.params.id;

  const result = await deleteCartItemService(id,req.user._id); // Use the new service
  req.session.cartCount = result.cartCount;

  res.status(result.status).json(result);
};
