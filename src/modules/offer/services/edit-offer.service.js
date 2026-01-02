import {
  findOfferById,
  findOfferByNameAndType,
  updateOfferById,
} from "../offer.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { OfferMessages } from "../../../shared/constants/messages/offerMessages.js";

// Edit offer service - validate and update offer
export const editOfferService = async (id, offerData) => {
  const offer = await findOfferById(id);
  if (!offer) {
    throw new AppError(OfferMessages.OFFER_NOT_FOUND, HttpStatus.NOT_FOUND);
  }

  if (offer.offerName !== offerData.offerName) {
    const existing = await findOfferByNameAndType(
      offerData.offerName,
      offerData.offerType
    );

    if (existing) {
      throw new AppError(OfferMessages.OFFER_EXISTS, HttpStatus.BAD_REQUEST);
    }
  }

  await updateOfferById(id, offerData);
  return true;
};
