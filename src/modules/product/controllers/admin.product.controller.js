// src/controllers/product.controller.js
import {
  getFilteredProducts,
  addProductService,
  editProductService,
  toggleProductService,
  getProductsBySearch,
  getProductByIdService,
} from "../services/index.js";
import { productValidationSchema } from "../product.validator.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";

export const loadProducts = async (req, res, next) => {
  try {
    const search = req.query.search || "";
    const status = req.query.status || "All";
    const brand = req.query.brand || "";
    const currentPage = parseInt(req.query.page) || 1;

    const result = await getFilteredProducts({ search, status, brand, page: currentPage, limit: 5 });

    res.status(HttpStatus.OK).render("admin/products", {
      pageTitle: "Products",
      pageCss: "products",
      pageJs: "products",
      products: result.products,
      brands: result.brands,
      totalDocuments: result.totalDocuments,
      limit: result.limit,
      totalPages: result.totalPages,
      currentPage,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

export const addProduct = async (req, res) => {
  try {
    // Validate minimal product-level fields
    const { error } = productValidationSchema.validate(req.body);
    if (error) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.message });

    const result = await addProductService(req.body, req.files || []);
    return res.status(HttpStatus.OK).json({ success: true, message: "Product added successfully", product: result.product });
  } catch (err) {
    console.error("Add Product Error:", err.message || err);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message || "Server error" });
  }
};

export const editProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { error } = productValidationSchema.validate(req.body);
    if (error) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, message: error.message });

    await editProductService(productId, req.body, req.files || []);
    return res.status(HttpStatus.OK).json({ success: true, message: "Product updated successfully" });
  } catch (err) {
    console.error("Edit Product Error:", err.message || err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
};

export const toggleProduct = async (req, res) => {
  try {
    await toggleProductService(req.params.productId);
    return res.status(HttpStatus.OK).json({ success: true });
  } catch (err) {
    return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: err.message || "Product not found" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const q = req.query.q || "";
    const products = await getProductsBySearch(q);
    res.status(HttpStatus.OK).json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await getProductByIdService(productId);
    if (!product) return res.status(HttpStatus.NOT_FOUND).json({ success: false, message: "Product not found" });
    res.status(HttpStatus.OK).json({ success: true, products: product });
  } catch (err) {
    console.error(err);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, message: "Server error" });
  }
};
