import {
  createOffer,
  findOfferByNameAndType,
} from "../offer.repo.js";

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
