import express from "express";
import setLayout from "../middlewares/setLayout.js";
const router = express.Router();
import passport from "passport";

import {
  loadShop,
  loadHome,
  loadProductDetails,
} from "../controllers/user/userController.js";
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
} from "../controllers/user/profileController.js";
import {
  loadSignUp,
  registerUser,
  loadLogin,
  googleLogin,
  loginUser,
  loadVerifyOtp,
  verifyOtp,
  resendOtp,
  loadForgotPassword,
  loadResetPassword,
  sendRecoverOtp,
  verifyRecoverOtp,
  loadRecoverOtp,
  saveNewPassword,
  logOutUser,
} from "../controllers/user/authController.js";
import {
  isBlocked,
  isLogin,
  isResetPass,
  isVerifyOtp,
  isVerifyRecoveryOtp,
  requireLogin,
} from "../middlewares/userAuth.js";
import upload from "../middlewares/upload.js";
import {
  addAddress,
  deleteAddress,
  editAddress,
  loadManageAddress,
  setDefaultAddress,
} from "../controllers/user/addressController.js";
import { addToCart, deleteCartItem, loadCart, updateCartItem } from "../controllers/user/cartController.js";
import { laodCheckOut } from "../controllers/user/checkoutController.js";
import { cancelOrderItems, downloadInvoice, laodMyOrders, loadOrderDetails, loadOrderSuccess, loadTrackOrder, placeOrder, returnOrderItems } from "../controllers/user/orderController.js";

router.use(setLayout("user"));

//login
router.get("/login", isLogin, loadLogin);
router.post("/login", loginUser);

//forgot-password
router.get("/forgotPassword", isLogin, loadForgotPassword);
router.post("/forgotPassword", sendRecoverOtp);
router.get("/verifyRecoverOtp", isVerifyRecoveryOtp, loadRecoverOtp);
router.post("/verifyRecoverOtp", verifyRecoverOtp);
router.get("/resetPassword", isResetPass, loadResetPassword);
router.post("/resetPassword", saveNewPassword);

//signup
router.get("/signup", isLogin, loadSignUp);
router.post("/register", registerUser);
router.get("/verifyOtp", isVerifyOtp, loadVerifyOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);

//google auth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/signup" }),
  googleLogin
);

//home
router.get("/home", isBlocked, loadHome);
router.get("/shop", isBlocked, loadShop);
router.get("/product/:variantId", loadProductDetails);

//profile
router.get("/personal-info", requireLogin, isBlocked, loadPersonalInfo);
router.get("/edit-info", requireLogin, isBlocked, loadEditInfo);
router.patch("/edit-info", upload.user.single("profilePicture"), editInfo);
router.get("/edit-email", requireLogin, isBlocked, loadEditEmail);
router.post("/edit-email", editEmail);
router.post("/edit-email/otp", sendOtpToEditEmail);
router.post("/edit-email/resend-otp", reSendOtpToEditEmail);
router.get("/change-password", requireLogin, isBlocked, loadChangePassword);
router.post("/update-password", updatePassword);

//address
router.get("/address", loadManageAddress);
router.post("/address", addAddress);
router.put("/address/:addressId", editAddress);
router.patch('/address/:addressId/set-default',setDefaultAddress);
router.delete('/address/:addressId',deleteAddress);

//cart
router.get('/cart',loadCart);
router.post('/cart/add',addToCart)
router.patch("/cart/update/:id", updateCartItem);
router.delete('/cart/remove/:id',deleteCartItem);

//checkout
router.get('/checkout',laodCheckOut);

//order
router.get('/orders',requireLogin,laodMyOrders);
router.post('/order/place',placeOrder);
router.get('/order/success/:id',requireLogin,loadOrderSuccess);
router.post('/order/:id/cancel-items',cancelOrderItems);
router.post('/order/:id/return-items',returnOrderItems);
router.get('/order/track/:id',requireLogin,loadTrackOrder);
router.get('/order/details/:id',requireLogin,loadOrderDetails);
router.get('/order/invoice/:orderId',requireLogin,downloadInvoice);


//logout
router.get("/logout", logOutUser);

export default router;
