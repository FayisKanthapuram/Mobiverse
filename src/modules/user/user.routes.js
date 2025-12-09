import express from "express";
import upload from "../../shared/middlewares/upload.js";
import {
  loadPersonalInfo,
  loadEditInfo,
  loadEditEmail,
  editInfo,
  loadChangePassword,
  editEmail,
  sendOtpToEditEmail,
  reSendOtpToEditEmail,
  updatePassword,
} from "./user.controller.js";
import { requireLogin } from "../../shared/middlewares/userAuth.js";

const router = express.Router();

router.get("/personal-info", requireLogin, loadPersonalInfo);
router.get("/edit-info", requireLogin, loadEditInfo);
router.patch("/edit-info",requireLogin, upload.user, editInfo);
router.get("/edit-email", requireLogin, loadEditEmail);
router.post("/edit-email",requireLogin, editEmail);
router.post("/edit-email/otp",requireLogin, sendOtpToEditEmail);
router.post("/edit-email/resend-otp",requireLogin, reSendOtpToEditEmail);
router.get("/change-password", requireLogin, loadChangePassword);
router.post("/update-password",requireLogin, updatePassword);

export default router;
