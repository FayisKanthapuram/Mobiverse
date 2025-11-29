import express from "express";
import { laodCheckOut } from "../../controllers/user/checkout.controller.js";
import { requireLogin } from "../../middlewares/userAuth.js";

const router = express.Router();

router.get("/checkout", requireLogin, laodCheckOut);

export default router;
