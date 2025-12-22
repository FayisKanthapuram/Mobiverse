import express from "express";
import { loadHome, loadAbout, loadContact } from "./home.controller.js";

const router = express.Router();

router.get('/',loadHome);
router.get('/home',loadHome);
router.get('/about',loadAbout)
router.get('/contact',loadContact)

export default router;