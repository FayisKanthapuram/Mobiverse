import express from "express";
import upload from "../../middlewares/upload.js";
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
} from "../../controllers/user/profile.controller.js";
import { requireLogin } from "../../middlewares/userAuth.js";

const router = express.Router();

router.get("/personal-info", requireLogin, loadPersonalInfo);
router.get("/edit-info", requireLogin, loadEditInfo);
// router.patch("/edit-info", upload.user.single("profilePicture"), editInfo);
router.get("/edit-email", requireLogin, loadEditEmail);
router.post("/edit-email", editEmail);
router.post("/edit-email/otp", sendOtpToEditEmail);
router.post("/edit-email/resend-otp", reSendOtpToEditEmail);
router.get("/change-password", requireLogin, loadChangePassword);
router.post("/update-password", updatePassword);

export default router;
