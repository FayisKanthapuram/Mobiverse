import { deleteOfferById, findOfferById } from "../offer.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { OfferMessages } from "../../../shared/constants/messages/offerMessages.js";

// Delete offer service
export const deleteOfferStatusService = async (id) => {
  const offer = await findOfferById(id);
  if (!offer) {
    throw new AppError(OfferMessages.OFFER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  await deleteOfferById(id);
  return true;
};
