import express from "express";
import { verifyAdmin } from "../../middlewares/adminAuth.js";
import { addOffer, deleteOffer, editOffer, getOfferById, loadOffers, toggleOfferStatus } from "./offer.controller.js";

const router = express.Router();
router.get("/", verifyAdmin, loadOffers);
router.post('/',addOffer);
router.get('/:id',verifyAdmin,getOfferById);
router.put('/:id',editOffer);
router.patch('/:id/toggle-status',toggleOfferStatus);
router.delete('/:id',deleteOffer);

export default router;


