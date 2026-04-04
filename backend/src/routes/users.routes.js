import { Router } from "express";
import { addToHistory, getUserHistory, login, register, getMeetingById, deleteMeeting, deleteMeetings } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 10 : 1000, // Bypass rate limit for tests
    message: { message: "Too many attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

const router = Router();

router.route("/login").post(authLimiter, login)
router.route("/register").post(authLimiter, register)
router.route("/add_to_activity").post(authMiddleware, addToHistory)
router.route("/get_all_activity").get(authMiddleware, getUserHistory)
router.route("/meeting/delete").post(authMiddleware, deleteMeetings)
router.route("/meeting/:meetingCode").get(authMiddleware, getMeetingById)
router.route("/meeting/:id").delete(authMiddleware, deleteMeeting)

export default router;