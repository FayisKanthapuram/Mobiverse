import express from "express";
import { loadHome } from "./home.controller.js";

const router = express.Router();

router.get('/',loadHome);
router.get('/home',loadHome);

export default router;