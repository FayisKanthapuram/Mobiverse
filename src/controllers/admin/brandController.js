import {
  addBrandService,
  editBrandService,
  getBrandByIdService,
  listBrandService,
  loadBrandsService,
} from "../../services/brand/index.js";

export const loadBrands = async (req, res, next) => {
  try {
    const data = await loadBrandsService(req.query);

    res.render("admin/brands", {
      pageTitle: "Brands",
      pageCss: "brands",
      pageJs: "brands",
      brands: data.brands,
      currentPage: data.pagination.currentPage,
      totalDocuments: data.pagination.totalDocuments,
      totalPages: data.pagination.totalPages,
      limit: data.pagination.limit,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

export const addBrand = async (req, res) => {
  const result = await addBrandService(req.body, req.file);
  return res.status(result.status).json(result);
};

export const editBrand = async (req, res) => {
  const result = await editBrandService(req.body, req.file);
  return res.status(result.status).json(result);
};

export const listBrand = async (req, res) => {
  const result = await listBrandService(req.params.brandId);
  return res.status(result.status).json(result);
};

export const getBrandById = async (req, res) => {
  const result = await getBrandByIdService(req.params.id);
  return res.status(result.status).json(result);
};
