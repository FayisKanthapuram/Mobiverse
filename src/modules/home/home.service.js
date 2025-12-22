import bannersModel from "../banners/banners.model.js";
import { getHomeBrands } from "../brand/brand.repo.js";
import {
  getFeaturedProducts,
  getLatestProducts,
} from "../product/services/product.common.service.js";

export const loadHomeService = async (userId = null) => {
  // Static banner data
  const banners = await bannersModel.getActiveBanners();

  const latestProducts = await getLatestProducts(5, userId);
  const featuredProducts = await getFeaturedProducts(userId);
  const brands = await getHomeBrands();

  return {
    banners,
    latestProducts,
    featuredProducts,
    brands,
  };
};
