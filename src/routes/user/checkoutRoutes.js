import express from "express";
import { laodCheckOut } from "../../controllers/user/checkoutController.js";
import { requireLogin } from "../../middlewares/userAuth.js";

const router = express.Router();

router.get("/checkout", requireLogin, laodCheckOut);

export default router;
