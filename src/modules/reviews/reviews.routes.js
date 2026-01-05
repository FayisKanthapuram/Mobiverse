import express from "express";
import { createReview } from "./reviews.controller.js";
import { requireLogin } from "../../shared/middlewares/userAuth.js";

const router = express.Router();

router.post("/reviews", requireLogin, createReview);

export default router;
