import { createCartItem, fetchCartItems, findCartItem, findCartItemById, saveCartItem } from "../repositories/cart.repo.js";
import { calculateBasicCartTotals, calculateCartTotals } from "../helpers/cartTotals.helper.js";
import { getLatestProductsAgg } from "../modules/product/product.repo.js";
import { addToCartSchema } from "../validators/cartValidator.js";
import { findVariantByIdWithProduct } from "../modules/product/variant.repo.js";
import { findBrandById } from "../modules/brand/brand.repo.js";
import { HttpStatus } from "../constants/statusCode.js";
import { checkInWishlist, removeWishlistItem } from "../repositories/wishlist.repo.js";

export const loadCartService = async (userId) => {
  // Related products recommendation
  const relatedProducts = await getLatestProductsAgg(5,userId);

  // Fetch cart items for this user
  const items = await fetchCartItems(userId);

  // Calculate totals + fix invalid quantity
  const cartTotals = await calculateCartTotals(items);

  return {
    relatedProducts,
    cart: cartTotals,
  };
};

export const addToCartService = async (userId, body) => {
  // Validate payload
  const { error } = addToCartSchema.validate(body);
  if (error) {
    return {
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      success: false,
      message: error.details[0].message,
    };
  }

  const { variantId, quantity = 1 } = body;

  // Fetch variant + product
  const variant = await findVariantByIdWithProduct(variantId);
  if (!variant) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not found",
    };
  }

  // Brand check
  const brand = await findBrandById(variant.productId.brandID);
  if (!variant.isListed || !variant.productId.isListed || !brand?.isListed) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not found",
    };
  }

  // Stock check
  if (variant.stock < 1) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not in stock",
    };
  }

  const inWishlist=await checkInWishlist(userId,variant.productId._id,variant._id);
  if(inWishlist){
    await removeWishlistItem(userId,variant.productId._id,variant._id);
  }

  // Check existing cart item
  const existing = await findCartItem(userId, variant._id);
  if (existing) {
    console.log(existing)
    // Keep original behaviour: increment by 1 (you can change to +quantity if desired)
    if (existing.quantity + 1 > variant.stock) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        success: false,
        message:
          "Product is already in the cart and has reached maximum stock, so the quantity cannot be increased.",
      };
    }

    existing.quantity = existing.quantity + 1;
    await saveCartItem(existing);

    return {
      status: HttpStatus.OK,
      success: true,
      message: "Product is already in the cart. Quantity has been updated",
    };
  }

  // Create new cart entry
  await createCartItem({
    userId,
    productId: variant.productId._id,
    variantId: variant._id,
    quantity,
  });

  return {
    status: HttpStatus.CREATED,
    success: true,
  };
};

export const updateCartItemService = async (itemId, userId, body) => {
  // 1. Fetch cart item
  const item = await findCartItemById(itemId);
  if (!item) {
    return {
      status: HttpStatus.NOT_FOUND,
      success: false,
      message: "Product is not found in your cart",
    };
  }

  // 2. Update quantity
  const quantity = Number(body.quantity || 1);
  item.quantity = quantity;

  await saveCartItem(item);

  // 3. Recalculate totals for this user
  const items = await fetchCartItems(userId);
  const totals = calculateBasicCartTotals(items,item._id);

  return {
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
