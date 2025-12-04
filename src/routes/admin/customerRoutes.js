import express from "express";
import {
  blockCustomer,
  loadCustomers,
} from "../../controllers/admin/customerController.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";
import { searchCustomer } from "../../controllers/admin/coupon.controller.js";

const router = express.Router();

router.get("/customers", verifyAdmin, loadCustomers);
router.patch("/customer/block/:id", blockCustomer);
router.get("/customers/search",verifyAdmin,searchCustomer);

export default router;
