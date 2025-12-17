import {
  addBrandService,
  editBrandService,
  getBrandByIdService,
  listBrandService,
  loadBrandsService,
} from "./services/index.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { BrandMessages } from "../../shared/constants/messages/brandMessages.js";

/* ----------------------------------------------------
   LOAD BRANDS PAGE
---------------------------------------------------- */
export const loadBrands = async (req, res) => {
  const data = await loadBrandsService(req.query);

  res.status(HttpStatus.OK).render("admin/brands", {
    pageTitle: "Brands",
    // pageCss: "brands",
    pageJs: "brands",
    brands: data.brands,
    currentPage: data.pagination.currentPage,
    totalDocuments: data.pagination.totalDocuments,
    totalPages: data.pagination.totalPages,
    limit: data.pagination.limit,
    query: req.query,
  });
};

/* ----------------------------------------------------
   ADD BRAND
---------------------------------------------------- */
export const addBrand = async (req, res) => {
  const brand = await addBrandService(req.body, req.file);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: BrandMessages.BRAND_ADDED,
    brand,
  });
};

/* ----------------------------------------------------
   EDIT BRAND
---------------------------------------------------- */
export const editBrand = async (req, res) => {
  const brand = await editBrandService(req.body, req.file);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BrandMessages.BRAND_UPDATED,
    brand,
  });
};

/* ----------------------------------------------------
   LIST / UNLIST BRAND
---------------------------------------------------- */
export const listBrand = async (req, res) => {
  await listBrandService(req.params.brandId);

  res.status(HttpStatus.OK).json({
    success: true,
    message: BrandMessages.BRAND_STATUS_UPDATED,
  });
};

/* ----------------------------------------------------
   GET BRAND BY ID
---------------------------------------------------- */
export const getBrandById = async (req, res) => {
  const brand = await getBrandByIdService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    brand,
  });
};
