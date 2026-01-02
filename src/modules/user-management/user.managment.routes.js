import express from "express";
import { blockUsers, loadUsers, searchUser } from "./user.managment.controller.js";
import { verifyAdmin } from "../../shared/middlewares/adminAuth.js";

// User management routes - admin endpoints
const router = express.Router();

// Render users listing
router.get("/", verifyAdmin, loadUsers);

// Block or unblock a user
router.patch("/block/:id", blockUsers);

// AJAX user search
router.get("/search", verifyAdmin, searchUser);

export default router;
