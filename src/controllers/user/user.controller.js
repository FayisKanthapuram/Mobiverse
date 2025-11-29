import productModel from "../../models/productModel.js";
import variantModel from "../../models/variantModel.js";
import { loadHomeService } from "../../services/home.service.js";
import { loadProductDetailsService } from "../../services/product.details.service.js";
import { loadShopService } from "../../services/shop.service.js";

export const loadHome = async (req, res, next) => {
  try {
    const data = await loadHomeService();

    return res.render("user/home", {
      ...data,
      pageTitle: "Home",
      pageJs: "home",
    });
  } catch (error) {
    next(error);
  }
};

export const loadShop = async (req, res, next) => {
  try {
    const data = await loadShopService(req.query);

    return res.render("user/shop", {
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
    const data = await loadProductDetailsService(req.params, req.query);

    return res.render("user/productDetails", {
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

