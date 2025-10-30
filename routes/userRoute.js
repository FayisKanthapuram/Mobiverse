import express from "express";
import setLayout from "../middlewares/setLayout.js";
const router=express.Router()

import { loadHome } from "../controllers/user/userController.js";
import { loadSignUp } from "../controllers/user/authController.js";

router.use(setLayout("user"));
router.get('/',loadHome);
router.get('/signUp',loadSignUp);



export default router;