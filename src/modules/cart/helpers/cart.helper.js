export const markCartStatus = (products, cart) => {
  if (!products?.length || !cart?.length) {
    return products;
  }

  const cartVariantSet = new Set(cart.map((item) => item.variantId.toString()));

  return products.map((product) => {
    product.variants.isInCart = cartVariantSet.has(
      product.variants._id.toString()
    );
    return product;
  });
};
