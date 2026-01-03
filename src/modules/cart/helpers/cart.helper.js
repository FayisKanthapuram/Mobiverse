export const markCartStatus = (products, cart) => {
  if (!products?.length || !cart?.items?.length) {
    return products;
  }

  // Collect variantIds present in cart
  const cartVariantSet = new Set(
    cart.items.map((item) => item.variantId.toString())
  );

  return products.map((product) => {
    if (product.variants?._id) {
      product.variants.isInCart = cartVariantSet.has(
        product.variants._id.toString()
      );
    }
    return product;
  });
};
