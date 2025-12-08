import express from "express";
import { requireLogin } from "../../shared/middlewares/userAuth.js";
import { toggleWishlist, checkWishlist, loadWishlist, clearWishlist } from "./wishlist.controller.js";


const router = express.Router();

router.get('/wishlist',requireLogin,loadWishlist);
router.post('/wishlist/toggle',toggleWishlist);
router.get('/wishlist/check/:variantId',requireLogin,checkWishlist);
router.delete('/wishlist/clear',requireLogin,clearWishlist);

export default router;
