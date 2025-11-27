// services/offerService.js
import brandModel from "../models/brandModel.js";

export const getOfferPageData = async (offerType,searchQuery,statusFilter,sortFilter,currentPage) => {
  const brands = await brandModel.find({ isListed: true });

  return {
    brands,
    analytics: {},
    offers: [],
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
