import { Router } from "express";
import { addToHistory, getUserHistory, getMeetingById, deleteMeeting, deleteMeetings } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = Router();

// ── Protected Routes (require JWT) ─────────────────────
router.post("/add_to_activity",   authMiddleware, addToHistory);
router.get("/get_all_activity",   authMiddleware, getUserHistory);
router.post("/meeting/delete",    authMiddleware, deleteMeetings);
router.get("/meeting/:meetingCode", authMiddleware, getMeetingById);
router.delete("/meeting/:id",     authMiddleware, deleteMeeting);

export default router;