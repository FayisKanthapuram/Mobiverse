export const markWishlistStatus = (latestProducts, wishlistItems) => {
  if (!latestProducts?.length || !wishlistItems?.length) return latestProducts;

  const wishlistVariantIds = wishlistItems[0].items.map((item) =>
    item.variantId._id.toString()
  );

  return latestProducts.map((product) => {
    product.variants.isInWishlist = wishlistVariantIds.includes(
      product.variants._id.toString()
    );
    return product;
  });
};
