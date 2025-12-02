// services/offerService.js
import { findAllListedBrands } from "../repositories/brand.repo.js";
import {
  createOffer,
  deleteOfferById,
  findAllOffers,
  findOfferById,
  findOfferByNameAndType,
  toggleOfferStatus,
  updateOfferById,
} from "../repositories/offer.repo.js";

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

export const addOfferService = async (offerData) => {
  try {
    const existing = await findOfferByNameAndType(
      offerData.offerName,
      offerData.offerType
    );

    if (existing) {
      const error = new Error("Offer already exists");
      error.status = 400;
      throw error;
    }

    // Create new offer
    await createOffer(offerData);
    return;
  } catch (error) {
    throw error;
  }
};

export const editOfferService = async (id, offerData) => {
  const offer = await findOfferById(id);

  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }

  if (offer.offerName !== offerData.offerName) {
    const existing = await findOfferByNameAndType(
      offerData.offerName,
      offerData.offerType
    );

    if (existing) {
      const err = new Error("Offer already exists");
      err.status = 400;
      throw err;
    }
  }

  await updateOfferById(id, offerData);
};

export const getOfferByIdService = async (id) => {
  const offer = await findOfferById(id);

  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }

  return offer;
};


export const toggleOfferStatusService = async (id) => {
  const offer = await toggleOfferStatus(id);

  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }
};

export const deleteOfferStatusService = async (id) => {
  const offer = await findOfferById(id);

  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }

  await deleteOfferById(id);
};
