import { HttpStatus } from "../../shared/constants/statusCode.js";
import cartModel from "./cart.model.js";
import { addToCartService, loadCartService, updateCartItemService } from "./cart.service.js";

export const loadCart = async (req, res, next) => {
  try {
    const data = await loadCartService(req.session.user);
    return res.render("user/cart", {
      pageTitle: "Cart",
      pageJs: "cart",
      cart: data.cart,
      relatedProducts: data.relatedProducts,
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Please log in to add products to your cart.",
      });
    }

    const result = await addToCartService(req.session.user, req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error on add to cart", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};


export const updateCartItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.session.user;

    const result = await updateCartItemService(itemId, userId, req.body);

    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Error while updating cart", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};


export const deleteCartItem = async (req, res) => {
  try {
    const id = req.params.id;
    const item = await cartModel.findById(id);
    if (!item) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ success: false, message: "product is not found" });
    }
    await item.deleteOne();

    return res.status(HttpStatus.OK).json({
      success: true,
    });
  } catch (error) {
    console.error("Error on delete", error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
