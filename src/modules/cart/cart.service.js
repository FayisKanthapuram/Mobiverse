import {
  createCartItem,
  fetchCartItems,
  findCartItem,
  findCartItemById,
  getCartItemsCount,
  saveCartItem,
} from "./cart.repo.js";
import {
  calculateBasicCartTotals,
  calculateCartTotals,
} from "./helpers/cartTotals.helper.js";
import { addToCartSchema } from "./cart.validator.js";
import { findVariantByIdWithProduct } from "../product/repo/variant.repo.js";
import { findBrandById } from "../brand/brand.repo.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";
import {
  checkInWishlist,
  getWishlistItemsCount,
  removeWishlistItem,
} from "../wishlist/wishlist.repo.js";
import { getLatestProducts } from "../product/services/product.common.service.js";
import { getAppliedOffer } from "../product/helpers/user.product.helper.js";

/* ----------------------------------------------------
   LOAD CART SERVICE
---------------------------------------------------- */
export const loadCartService = async (userId) => {
  const relatedProducts = await getLatestProducts(5, userId);
  const items = await fetchCartItems(userId);
  // ---------------- OFFERS ----------------
  for (let item of items) {
    item.offer = getAppliedOffer(item, item?.variantId?.salePrice)||0;
  }
  const cartTotals = await calculateCartTotals(items);
  const cartCount=await getCartItemsCount(userId);

  return {
    cartCount,
    relatedProducts,
    cart: cartTotals,
  };
};

/* ----------------------------------------------------
   ADD TO CART SERVICE
---------------------------------------------------- */
export const addToCartService = async (userId, body) => {
  const { error } = addToCartSchema.validate(body);
  if (error) {
    throw new AppError(
      error.details[0].message,
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }

  const { variantId, quantity = 1,isMoveToCart } = body;

  const variant = await findVariantByIdWithProduct(variantId);
  if (!variant) {
    throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  }

  const brand = await findBrandById(variant.productId.brandID);
  if (!variant.isListed || !variant.productId.isListed || !brand?.isListed) {
    throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  }

  if (variant.stock < 1) {
    throw new AppError("Product is not in stock", HttpStatus.BAD_REQUEST);
  }

  const existing = await findCartItem(userId, variant._id);
  if (existing) {
    const cartCount = await getCartItemsCount(userId);
    const wishlistCount = await getWishlistItemsCount(userId);
    return {
      cartCount,
      wishlistCount,
      status: HttpStatus.CONFLICT,
      success: true,
      message: "Product is  already in the cart",
    };
  }

  if (isMoveToCart) {
    const inWishlist = await checkInWishlist(
      userId,
      variant.productId._id,
      variant._id
    );
    if (inWishlist) {
      await removeWishlistItem(userId, variant.productId._id, variant._id);
    }
  }

  await createCartItem({
    userId,
    productId: variant.productId._id,
    variantId: variant._id,
    quantity,
  });

  const cartCount = await getCartItemsCount(userId);
  const wishlistCount=await getWishlistItemsCount(userId);

  return {
    wishlistCount,
    cartCount,
    status: HttpStatus.CREATED,
    success: true,
    message: isMoveToCart
      ? "Item moved to cart"
      : "Item added to cart",
  };
};

/* ----------------------------------------------------
   UPDATE CART ITEM SERVICE
---------------------------------------------------- */
export const updateCartItemService = async (itemId, userId, body) => {
  const item = await findCartItemById(itemId);
  if (!item) {
    throw new AppError("Product not found in your cart", HttpStatus.NOT_FOUND);
  }

  const quantity = Number(body.quantity || 1);
  if (quantity < 1 || quantity > item.variantId.stock) {
    throw new AppError("Invalid quantity", HttpStatus.UNPROCESSABLE_ENTITY);
  }

  item.quantity = quantity;
  await saveCartItem(item);

  const items = await fetchCartItems(userId);
  // ---------------- OFFERS ----------------
  for (let item of items) {
    item.offer = getAppliedOffer(item, item?.variantId?.salePrice) || 0;
  }
  const totals = calculateBasicCartTotals(items, item._id);
  const cartCount = await getCartItemsCount(userId);

  return {
    cartCount,
    status: HttpStatus.ACCEPTED,
    success: true,
    updatedItem: {
      quantity,
      salePrice: item.variantId.salePrice,
      regularPrice: item.variantId.regularPrice,
      stock: item.variantId.stock,
    },
    cartTotals: totals,
  };
};

/* ----------------------------------------------------
   DELETE CART ITEM SERVICE
---------------------------------------------------- */
export const deleteCartItemService = async (itemId,userId) => {
  const item = await findCartItemById(itemId);
  if (!item) {
    throw new AppError("Product not found", HttpStatus.NOT_FOUND);
  }

  await item.deleteOne();

  const cartCount = await getCartItemsCount(userId);


  return {
    status: HttpStatus.OK,
    cartCount,
    success: true,
    message: "Item successfully removed from the cart.",
  };
};
