import {
  findOfferById,
  findOfferByNameAndType,
  updateOfferById,
} from "../offer.repo.js";

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
