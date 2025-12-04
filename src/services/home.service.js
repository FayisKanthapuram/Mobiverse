import {
  getLatestProductsAgg,
  getFeaturedProductsAgg,
} from "../repositories/product.repo.js";
import { getHomeBrands } from "../repositories/brand.repo.js";

export const loadHomeService = async (userId=null) => {
  // Static banner data
  const heroData = {
    title: "SAMSUNG GALAXY S23 ULTRA 5G",
    subtitle: "The Future in Your Hand. Order now and get exclusive launch offers.",
    link: "/shop/s23-ultra",
    image: "/images/s23-ultra-hero.png",
  };

  const latestProducts = await getLatestProductsAgg(5,userId);
  const featuredProducts = await getFeaturedProductsAgg(userId);
  const brands = await getHomeBrands();

  return {
    heroData,
    latestProducts,
    featuredProducts,
    brands,
  };
};
