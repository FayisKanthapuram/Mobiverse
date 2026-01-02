import { toggleOfferStatus } from "../offer.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { OfferMessages } from "../../../shared/constants/messages/offerMessages.js";

// Toggle offer status service
export const toggleOfferStatusService = async (id) => {
  const offer = await toggleOfferStatus(id);
  if (!offer) {
    throw new AppError(OfferMessages.OFFER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  return true;
};
