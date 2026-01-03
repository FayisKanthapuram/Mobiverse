import {
  addItemToCart,
  fetchCartItems,
  findCartItem,
  findUserCart,
  getCartItemsCount,
  removeCartItem,
  updateCartItemQuantity,
} from "./cart.repo.js";
import {
  calculateBasicCartTotals,
  calculateCartTotals,
} from "./helpers/cartTotals.helper.js";
import { addToCartSchema } from "./cart.validator.js";
import { findVariantByIdWithProduct } from "../product/repo/variant.repo.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";
import { getLatestProducts } from "../product/services/product.common.service.js";
import { getAppliedOffer } from "../product/helpers/user.product.helper.js";
import { CartMessages } from "../../shared/constants/messages/cartMessages.js";
import { checkInWishlist, getWishlistItemsCount, removeWishlistItem } from "../wishlist/wishlist.repo.js";

// Cart service - business logic for user cart operations

// Load cart service
export const loadCartService = async (userId) => {
  const relatedProducts = await getLatestProducts(5, userId);
  const items = await fetchCartItems(userId);
  // ---------------- OFFERS ----------------
  for (let item of items) {
    item.offer = getAppliedOffer(item, item?.variantId?.salePrice) || 0;
  }
  const cartTotals = await calculateCartTotals(userId,items);
  const cartCount = await getCartItemsCount(userId);
  

  return {
    cartCount,
    relatedProducts,
    cart: cartTotals,
  };
};

// Add to cart service
export const addToCartService = async (userId, body) => {
  const { error } = addToCartSchema.validate(body);
  if (error) {
    throw new AppError(
      error.details[0].message,
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }

  const { variantId, quantity = 1 ,isMoveToCart} = body;

  const variant = await findVariantByIdWithProduct(variantId);
  if (!variant || !variant.isListed || !variant.productId.isListed) {
    throw new AppError(CartMessages.PRODUCT_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  const exists = await findCartItem(userId, variantId);
  if (exists) {
    const cartCount = await getCartItemsCount(userId);
    const wishlistCount = await getWishlistItemsCount(userId);
    return {
      cartCount,
      wishlistCount,
      status: HttpStatus.CONFLICT,
      success: true,
      message: CartMessages.ALREADY_IN_CART,
      cartCount: await getCartItemsCount(userId),
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

  await addItemToCart(userId, {
    productId: variant.productId._id,
    variantId,
    quantity,
  });

  return {
    status: HttpStatus.CREATED,
    success: true,
    message: CartMessages.ITEM_ADDED_TO_CART,
    cartCount: await getCartItemsCount(userId),
    wishlistCount:await getWishlistItemsCount(userId),
  };
};


// Update cart item service
export const updateCartItemService = async (userId, variantId, body) => {
  const quantity = Number(body.quantity);

  if (quantity < 1) {
    throw new AppError(
      CartMessages.INVALID_QUANTITY,
      HttpStatus.UNPROCESSABLE_ENTITY
    );
  }

  await updateCartItemQuantity(userId, variantId, quantity);
  
  const item=await findCartItem(userId,variantId)
  const items = await fetchCartItems(userId);
  for (let item of items) {
    item.offer = getAppliedOffer(item, item?.variantId?.salePrice) || 0;
  }
  const totals = calculateBasicCartTotals(items,item.variantId._id);

  return {
    success: true,
    status: HttpStatus.ACCEPTED,
    cartTotals: totals,
    updatedItem: {
      quantity,
      salePrice: item.variantId.salePrice,
      regularPrice: item.variantId.regularPrice,
      stock: item.variantId.stock,
    },
    cartCount: await getCartItemsCount(userId),
  };
};


// Delete cart item service
export const deleteCartItemService = async (userId, variantId) => {
  await removeCartItem(userId, variantId);
  
  return {
    success: true,
    status: HttpStatus.OK,
    message: CartMessages.ITEM_REMOVED,
    cartCount: await getCartItemsCount(userId),
  };
};

