import express from "express";
import { isLogin } from "../../shared/middlewares/adminAuth.js";
import {
  loadLogin,
  registerAdmin,
  loginAdmin,
  logoutAdmin,
} from "./admin.auth.controller.js";
import nocache from "nocache";

const router = express.Router();

router.use(nocache())

// Admin auth routes - endpoints for admin authentication
router.get("/login", isLogin, loadLogin);
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", logoutAdmin);

export default router;
