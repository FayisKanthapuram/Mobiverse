import {
  findBrands,
  countBrands,
} from "../brand.repo.js";

export const loadBrandsService = async (queryParams) => {
  const search = queryParams.search || "";
  const filter = queryParams.filter || "All";
  const currentPage = parseInt(queryParams.page) || 1;

  const limit = 5;
  const skip = (currentPage - 1) * limit;

  const query = {};

  if (search) {
    query.brandName = { $regex: search, $options: "i" };
  }

  if (filter === "listed") query.isListed = true;
  if (filter === "unlisted") query.isListed = false;

  const totalDocuments = await countBrands(query);
  const totalPages = Math.ceil(totalDocuments / limit);

  const brands = await findBrands(query, limit, skip);

  return {
    brands,
    pagination: {
      currentPage,
      totalDocuments,
      totalPages,
      limit,
    },
  };
};
