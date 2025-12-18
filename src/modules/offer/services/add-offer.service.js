import { createOffer, findOfferByNameAndType } from "../offer.repo.js";
import { AppError } from "../../../shared/utils/app.error.js";
import { HttpStatus } from "../../../shared/constants/statusCode.js";
import { OfferMessages } from "../../../shared/constants/messages/offerMessages.js";

export const addOfferService = async (offerData) => {
  const existing = await findOfferByNameAndType(
    offerData.offerName,
    offerData.offerType
  );

  if (existing) {
    throw new AppError(OfferMessages.OFFER_EXISTS, HttpStatus.BAD_REQUEST);
  }

  await createOffer(offerData);
  return true;
};
