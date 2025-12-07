import { findAllListedBrands } from "../../brand/brand.repo.js";
import { findAllOffers } from "../offer.repo.js";

export const getOfferPageDataService = async (
  offerType,
  searchQuery,
  statusFilter,
  sortFilter,
  currentPage
) => {
  const brands = await findAllListedBrands();
  const offers = await findAllOffers({ offerType });

  return {
    brands,
    analytics: {},
    offers,
    currentPage,
    totalPages: 5,
    totalOffers: 45,
    limit: 10,
    offerType,
    searchQuery,
    statusFilter,
    sortFilter,
  };
};
