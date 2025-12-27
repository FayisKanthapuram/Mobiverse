export const markWishlistStatus = (latestProducts, wishlist) => {
  if (!latestProducts?.length || !wishlist?.items?.length) {
    return latestProducts;
  }

  const wishlistVariantSet = new Set(
    wishlist.items.map((item) => item.variantId.toString())
  );

  return latestProducts.map((product) => {
    product.variants.isInWishlist = wishlistVariantSet.has(
      product.variants._id.toString()
    );
    return product;
  });
};
