import {
  deleteOfferById,
  findOfferById,
} from "../offer.repo.js";

export const deleteOfferStatusService = async (id) => {
  const offer = await findOfferById(id);

  if (!offer) {
    const err = new Error("Offer not found");
    err.status = 404;
    throw err;
  }

  await deleteOfferById(id);
};
