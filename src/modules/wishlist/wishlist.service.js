import { HttpStatus } from "../../shared/constants/statusCode.js";
import { getAppliedOffer } from "../product/helpers/user.product.helper.js";
import { findBrandById } from "../brand/brand.repo.js";
import {
  getAvailableBrandOffers,
  getAvailableProductOffers,
} from "../offer/offer.repo.js";
import { findVariantByIdWithProduct } from "../product/repo/variant.repo.js";
import {
  checkInWishlist,
  createWishlistItem,
  deleteWishlist,
  fetchWishlistItems,
  getWishlistItemsCount,
  removeWishlistItem,
} from "./wishlist.repo.js";
import { addToWishlistSchema } from "./wishlist.validator.js";
import { findUserById } from "../user/user.repo.js";

export const loadWishlistService = async (userId, queryParams) => {
  const currentPage = parseInt(queryParams.page) || 1;
  const totalDocuments = await getWishlistItemsCount(userId);
  const limit = 3;
  const skip = (currentPage - 1) * limit;
  const totalPages = Math.ceil(totalDocuments / limit);
  const wishlist = await fetchWishlistItems(userId, limit, skip);
  const now = new Date();
  const productOffers = await getAvailableProductOffers(now);
  const brandOffers = await getAvailableBrandOffers(now);
  if (wishlist.length > 0) {
    wishlist[0].items = wishlist[0].items.map((item) => {
      const brandOffer =
        brandOffers.filter(
          (offer) => offer.brandID.toString() === item.brandId._id.toString()
        ) || null;
      const productOffer = productOffers.filter((offer) =>
        offer.productID
          .map((id) => id.toString())
          .includes(item.productId._id.toString())
      );
      let offer = getAppliedOffer(
        { productOffer, brandOffer },
        item.variantId.salePrice
      );
      return {
        ...item,
        offer,
      };
    });
  }

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

  const wishlistCount = await getWishlistItemsCount(userId);

  if (inWishlist) {
    await removeWishlistItem(userId, variant.productId._id, variant._id);

    return {
      wishlistCount:wishlistCount-1,
      status: HttpStatus.CREATED,
      success: true,
      message: "Product removed from wishlist",
    };
  }

  await createWishlistItem(userId, variant.productId._id, variant._id);

  return {
    wishlistCount: wishlistCount + 1,
    status: HttpStatus.CREATED,
    success: true,
    action: "added",
    message: "Product added to wishlist",
  };
};

export const clearWishlistService = async (userId) => {
  await deleteWishlist(userId);
  return {
    message: "Wishlist cleared successfully",
    status: HttpStatus.OK,
    success: true,
  };
};

