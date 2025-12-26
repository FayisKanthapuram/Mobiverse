import {loadProductDetailsService,loadShopService} from "../services/index.js"
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const loadShop = async (req, res, next) => {
  try {
    const data = await loadShopService(req.query,req?.user?._id);

    return res.status(HttpStatus.OK).render("user/products/shop", {
      query: req.query,
      products: data.products,
      brands: data.brands,
      pageTitle: "Shop",
      breadcrumbs: [
        { name: "Home", link: "/home" },
        { name: "Shop", link: "/shop" },
        {
          name: req.query.brand
            ? req.query.brand.charAt(0).toUpperCase() +
              req.query.brand.slice(1).toLowerCase()
            : "All Brands",
        },
      ],
      pagination: data.pagination,
      pageJs: "shop",
    });
  } catch (error) {
    next(error);
  }
};

export const loadProductDetails = async (req, res, next) => {
  try {
    const data = await loadProductDetailsService(req.params, req.query,req?.user?._id);
    return res.status(HttpStatus.OK).render("user/products/productDetails", {
      ...data,
      pageTitle: data.product.name,
      pageJs: "productDetails",
      breadcrumbs: [
        { name: "Home", link: "/home" },
        { name: "Shop", link: "/shop" },
        {
          name: data.product.brands.brandName
            ? data.product.brands.brandName.charAt(0).toUpperCase() +
              data.product.brands.brandName.slice(1).toLowerCase()
            : "All Brands",
          link: `/shop?brand=${data.product.brands.brandName}`,
        },
        { name: data.product.name },
      ],
    });
  } catch (error) {
    next(error);
  }
};
