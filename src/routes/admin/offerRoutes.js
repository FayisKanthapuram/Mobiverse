import express from "express";
import { verifyAdmin } from "../../middlewares/adminAuth.js";
import { addOffer, deleteOffer, editOffer, getOfferById, loadOffers, toggleOfferStatus } from "../../controllers/admin/offerController.js";

const router = express.Router();
router.get("/offers", verifyAdmin, loadOffers);
router.post('/offers',addOffer);
router.get('/offers/:id',verifyAdmin,getOfferById);
router.put('/offers/:id',editOffer);
router.patch('/offers/:id/toggle-status',toggleOfferStatus);
router.delete('/offers/:id',deleteOffer);

export default router;


