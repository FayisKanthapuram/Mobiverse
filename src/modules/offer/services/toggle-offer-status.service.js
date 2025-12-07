import { toggleOfferStatus } from "../offer.repo.js";

export const toggleOfferStatusService = async (id) => {
  const offer = await toggleOfferStatus(id);

  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }
};
