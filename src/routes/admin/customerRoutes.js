import express from "express";
import {
  blockCustomer,
  loadCustomers,
} from "../../controllers/admin/customerController.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";


const router = express.Router();

router.get("/customers", verifyAdmin, loadCustomers);
router.patch("/customer/block/:id", blockCustomer);


export default router;
