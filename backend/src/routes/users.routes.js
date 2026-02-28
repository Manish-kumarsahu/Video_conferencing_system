import { Router } from "express";
import { addToHistory, getUserHistory, login, register } from "../controllers/user.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many attempts, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false
});

const router = Router();

router.route("/login").post(authLimiter, login)
router.route("/register").post(authLimiter, register)
router.route("/add_to_activity").post(authMiddleware, addToHistory)
router.route("/get_all_activity").get(authMiddleware, getUserHistory)

export default router;