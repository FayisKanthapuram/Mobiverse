import express from "express";
import { isLogin, verifyAdmin } from "../../middlewares/adminAuth.js";
import {
  loadLogin,
  loadDashboard,
  registerAdmin,
  loginAdmin,
  logoutAdmin,
} from "./admin.auth.controller.js";

const router = express.Router();

router.get("/login", isLogin, loadLogin);
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.get("/dashboard", verifyAdmin, loadDashboard);
router.post("/logout", logoutAdmin);

export default router;
