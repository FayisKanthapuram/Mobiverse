import {
  addOfferService,
  deleteOfferStatusService,
  editOfferService,
  getOfferByIdService,
  getOfferPageDataService,
  toggleOfferStatusService,
} from "./services/index.js";
import { offerSchema } from "./offerValidator.js";
import { HttpStatus } from "../../shared/constants/statusCode.js";
import { AppError } from "../../shared/utils/app.error.js";
import { OfferMessages } from "../../shared/constants/messages/offerMessages.js";

/* ----------------------------------------------------
   LOAD OFFERS PAGE
---------------------------------------------------- */
export const loadOffers = async (req, res) => {
  const offerType = req.query.type || "product";
  const searchQuery = req.query.search || "";
  const statusFilter = req.query.status || "";
  const currentPage = parseInt(req.query.page) || 1;
  const limit=2;

  const data = await getOfferPageDataService(
    offerType,
    searchQuery,
    statusFilter,
    currentPage,
    limit,
  );

  res.status(HttpStatus.OK).render("admin/offers", {
    pageTitle: "Offers",
    pageJs: "offers",
    ...data,
  });
};

/* ----------------------------------------------------
   ADD OFFER
---------------------------------------------------- */
export const addOffer = async (req, res) => {
  const { error } = offerSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await addOfferService(req.body);

  res.status(HttpStatus.CREATED).json({
    success: true,
    message: OfferMessages.OFFER_ADDED,
  });
};

/* ----------------------------------------------------
   GET OFFER BY ID
---------------------------------------------------- */
export const getOfferById = async (req, res) => {
  const offer = await getOfferByIdService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    offer,
  });
};

/* ----------------------------------------------------
   EDIT OFFER
---------------------------------------------------- */
export const editOffer = async (req, res) => {
  const { error } = offerSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, HttpStatus.BAD_REQUEST);
  }

  await editOfferService(req.params.id, req.body);

  res.status(HttpStatus.OK).json({
    success: true,
    message: OfferMessages.OFFER_UPDATED,
  });
};

/* ----------------------------------------------------
   TOGGLE OFFER STATUS
---------------------------------------------------- */
export const toggleOfferStatus = async (req, res) => {
  await toggleOfferStatusService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: OfferMessages.OFFER_STATUS_UPDATED,
  });
};

/* ----------------------------------------------------
   DELETE OFFER
---------------------------------------------------- */
export const deleteOffer = async (req, res) => {
  await deleteOfferStatusService(req.params.id);

  res.status(HttpStatus.OK).json({
    success: true,
    message: OfferMessages.OFFER_DELETED,
  });
};
