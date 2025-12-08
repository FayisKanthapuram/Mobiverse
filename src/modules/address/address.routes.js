import express from "express";
import {
  addAddress,
  deleteAddress,
  editAddress,
  loadManageAddress,
  setDefaultAddress,
} from "./address.controller.js";
import { requireLogin } from "../../shared/middlewares/userAuth.js";

const router = express.Router();

router.get("/address", requireLogin, loadManageAddress);
router.post("/address", addAddress);
router.put("/address/:addressId", editAddress);
router.patch("/address/:addressId/set-default", setDefaultAddress);
router.delete("/address/:addressId", deleteAddress);

export default router;
