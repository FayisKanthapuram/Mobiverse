import express from "express";
import { requireLogin } from "../../../shared/middlewares/userAuth.js";
import { laodRefferAndEarn } from "../controllers/user.referral.controller.js";

const router = express.Router();

router.get('/refer',requireLogin,laodRefferAndEarn)


export default router;