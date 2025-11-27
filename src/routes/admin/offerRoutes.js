import express from "express";
import { verifyAdmin } from "../../middlewares/adminAuth.js";
import { loadOffers } from "../../controllers/admin/offerController.js";

const router = express.Router();
router.get("/offers", verifyAdmin, loadOffers);

export default router;


