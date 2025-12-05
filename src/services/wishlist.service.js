import { HttpStatus } from "../constants/statusCode.js";
import { findBrandById } from "../repositories/brand.repo.js";
import { findCartItem } from "../repositories/cart.repo.js";
import { findUserById } from "../repositories/user.repo.js";
import { findVariantByIdWithProduct } from "../repositories/variant.repo.js";
import {
  checkInWishlist,
  createWishlistItem,
  deleteWishlist,
  fetchWishlistItems,
  getWishlistItemsCount,
  removeWishlistItem,
} from "../repositories/wishlist.repo.js";
import { addToWishlistSchema } from "../validators/wishlist.validator.js";

export const loadWishlistService = async (userId, queryParams) => {
  const currentPage = parseInt(queryParams.page) || 1;
  const totalDocuments = await getWishlistItemsCount(userId);
  const limit = 3;
  const skip = (currentPage - 1) * limit;
  const totalPages = Math.ceil(totalDocuments / limit);
  const wishlist = await fetchWishlistItems(userId, limit, skip);
  console.log(wishlist[0].items);
  const user = await findUserById(userId);
  return {
    wishlist,
    user,
    totalDocuments,
    limit,
    totalPages,
    currentPage,
  };
};

export const toggleWishlistService = async (userId, body) => {
  const { error } = addToWishlistSchema.validate(body);
  if (error) {
    return {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      success: false,
      message: error.details[0].message,
    };
  }

  const { variantId } = body;

  const inCart = await findCartItem(userId, variantId);
  if (inCart) {
    return {
      status: HttpStatus.FORBIDDEN,
      success: false,
      message: "Product is already on the cart",
    };
  }

  // Fetch variant + product
  const variant = await findVariantByIdWithProduct(variantId);
  if (!variant) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not found",
    };
  }

  const brand = await findBrandById(variant.productId.brandID);
  if (!variant.isListed || !variant.productId.isListed || !brand?.isListed) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not found",
    };
  }

  const inWishlist = await checkInWishlist(
    userId,
    variant.productId._id,
    variantId
  );

  if (inWishlist) {
    await removeWishlistItem(userId, variant.productId._id, variant._id);

    return {
      status: HttpStatus.CREATED,
      success: true,
      message: "Product removed from wishlist",
    };
  }

  await createWishlistItem(userId, variant.productId._id, variant._id);

  return {
    status: HttpStatus.CREATED,
    success: true,
    action: "added",
    message: "Product added to wishlist",
  };
};

export const clearWishlistService = async (userId) => {
  await deleteWishlist(userId);
  return {
    status: HttpStatus.OK,
    success: true,
  };
};

export const checkWishlistService = async (userId, params) => {
  const { error } = addToWishlistSchema.validate(params);
  if (error) {
    return {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      success: false,
      message: error.details[0].message,
    };
  }

  const { variantId } = params;

  // Fetch variant + product
  const variant = await findVariantByIdWithProduct(variantId);
  if (!variant) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not found",
    };
  }

  const brand = await findBrandById(variant.productId.brandID);
  if (!variant.isListed || !variant.productId.isListed || !brand?.isListed) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not found",
    };
  }

  const inWishlist = await checkInWishlist(
    userId,
    variant.productId._id,
    variantId
  );

  return {
    status: HttpStatus.OK,
    success: true,
    inWishlist,
  };
};
