import { findAllListedBrands } from "../../brand/brand.repo.js";
import { findVariantsByProduct } from "../../product/repo/variant.repo.js";
import { findAllOffers, findOffersCount } from "../offer.repo.js";

// Offer services - fetch data for offer admin pages
export const getOfferPageDataService = async (
  offerType,
  searchQuery,
  statusFilter,
  currentPage,
  limit
) => {
  const filter = { offerType };
  if (searchQuery) {
    filter.offerName = { $regex: searchQuery, $options: "i" };
  }
  const now = new Date();
  if (statusFilter === "active") {
    filter.isActive = true;
    filter.startDate = { $lte: now };
    filter.endDate = { $gte: now };
  }

  if (statusFilter === "inactive") {
    filter.isActive = false;
  }

  if (statusFilter === "expired") {
    filter.endDate = { $lt: now };
  }

  const skip = (currentPage - 1) * limit;

  const brands = await findAllListedBrands();
  const offers = await findAllOffers(filter, skip, limit);
  const totalOffers = await findOffersCount(filter);
  const activeQuery = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  };
  const analytics={}
  analytics.totalOffers=await findOffersCount();
  analytics.activeOffers = await findOffersCount(activeQuery);
  analytics.productOffers=await findOffersCount({offerType:'product'})
  analytics.brandOffers = await findOffersCount({ offerType: "brand" });
  const totalPages = Math.ceil(totalOffers / limit);

  for (const offer of offers) {
    for (const product of offer.productID) {
      const variants = await findVariantsByProduct(product._id);
      product.image = variants[0]?.images?.[0];
    }
  }

  return {
    brands,
    analytics,
    offers,
    currentPage,
    totalPages,
    totalOffers,
    limit,
    offerType,
    searchQuery,
    statusFilter,
  };
};
