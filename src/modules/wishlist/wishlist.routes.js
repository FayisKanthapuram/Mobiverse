import express from "express";
import { requireLogin } from "../../shared/middlewares/userAuth.js";
import { toggleWishlist, loadWishlist, clearWishlist } from "./wishlist.controller.js";


const router = express.Router();

// Wishlist routes - user wishlist endpoints
router.get('/wishlist', requireLogin, loadWishlist);
router.post('/wishlist/toggle', toggleWishlist);
router.delete('/wishlist/clear', requireLogin, clearWishlist);

export default router;
