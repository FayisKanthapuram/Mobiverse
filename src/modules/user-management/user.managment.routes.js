import express from "express";
import { blockUsers, loadUsers, searchUser } from "./user.managment.controller.js";
import { verifyAdmin } from "../../middlewares/adminAuth.js";


const router = express.Router();

router.get("/", verifyAdmin, loadUsers);
router.patch("/block/:id", blockUsers);
router.get("/search",verifyAdmin,searchUser);


export default router;
