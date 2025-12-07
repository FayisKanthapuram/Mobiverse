import { findOfferById } from "../offer.repo.js";

export const getOfferByIdService = async (id) => {
  const offer = await findOfferById(id);

  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }

  return offer;
};
