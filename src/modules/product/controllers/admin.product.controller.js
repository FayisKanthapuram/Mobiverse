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
import { AppError } from "../../../shared/utils/app.error.js";
import { ProductMessages } from "../../../shared/constants/messages/productMessages.js";

/* ----------------------------------------------------
   LOAD PRODUCTS PAGE
---------------------------------------------------- */
export const loadProducts = async (req, res) => {
  const search = req.query.search || "";
  const status = req.query.status || "All";
  const brand = req.query.brand || "";
  const currentPage = parseInt(req.query.page) || 1;

  const result = await getFilteredProducts({
    search,
    status,
    brand,
    page: currentPage,
    limit: 5,
  });

  res.status(HttpStatus.OK).render("admin/products", {
    pageTitle: "Products",
    pageJs: "products",
    products: result.products,
    brands: result.brands,
    totalDocuments: result.totalDocuments,
    limit: result.limit,
    totalPages: result.totalPages,
    currentPage,
    query: req.query,
  });
};

/* ----------------------------------------------------
   ADD PRODUCT
---------------------------------------------------- */
export const addProduct = async (req, res) => {
  const { error } = productValidationSchema.validate(req.body);
  if (error) {
    throw new AppError(error.message, HttpStatus.BAD_REQUEST);
  }

  const product = await addProductService(req.body, req.files || []);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: ProductMessages.PRODUCT_ADDED,
    product,
  });
};

/* ----------------------------------------------------
   EDIT PRODUCT
---------------------------------------------------- */
export const editProduct = async (req, res) => {
  const { error } = productValidationSchema.validate(req.body);
  if (error) {
    throw new AppError(error.message, HttpStatus.BAD_REQUEST);
  }

  await editProductService(req.params.productId, req.body, req.files || []);

  res.status(HttpStatus.OK).json({
    success: true,
    message: ProductMessages.PRODUCT_UPDATED,
  });
};

/* ----------------------------------------------------
   LIST / UNLIST PRODUCT
---------------------------------------------------- */
export const toggleProduct = async (req, res) => {
  await toggleProductService(req.params.productId);

  res.status(HttpStatus.OK).json({ success: true });
};

/* ----------------------------------------------------
   SEARCH PRODUCTS
---------------------------------------------------- */
export const getProducts = async (req, res) => {
  const q = req.query.q || "";
  const products = await getProductsBySearch(q);
  // console.log(products);

  res.status(HttpStatus.OK).json({
    success: true,
    products,
  });
};

/* ----------------------------------------------------
   GET PRODUCT BY ID
---------------------------------------------------- */
export const getProductById = async (req, res) => {
  const product = await getProductByIdService(req.params.productId);

  res.status(HttpStatus.OK).json({
    success: true,
    products:product,
  });
};
