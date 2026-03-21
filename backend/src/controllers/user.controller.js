import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";

// ── Login ──────────────────────────────────────────────
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username: username.trim() });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid username or password" });
        }

        const token = crypto.randomBytes(32).toString("hex");
        user.token = token;
        await user.save();

        return res.status(httpStatus.OK).json({ token });

    } catch (e) {
        console.error("[login]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong. Please try again." });
    }
};

// ── Register ───────────────────────────────────────────
const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Name, username and password are required" });
    }

    if (password.length < 6) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Password must be at least 6 characters" });
    }

    try {
        const existingUser = await User.findOne({ username: username.trim() });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({ message: "Username already taken" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name.trim(),
            username: username.trim(),
            password: hashedPassword,
        });

        await newUser.save();

        return res.status(httpStatus.CREATED).json({ message: "Account created successfully" });

    } catch (e) {
        console.error("[register]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong. Please try again." });
    }
};

// ── Get History ────────────────────────────────────────
const getUserHistory = async (req, res) => {
    try {
        const meetings = await Meeting.find({ user_id: req.user._id }).sort({ date: -1 });
        return res.status(httpStatus.OK).json(meetings);
    } catch (e) {
        console.error("[getUserHistory]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not fetch history" });
    }
};

// ── Add to History ─────────────────────────────────────
const addToHistory = async (req, res) => {
    const { meeting_code } = req.body;

    if (!meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    try {
        const newMeeting = new Meeting({
            user_id: req.user._id,
            meetingCode: meeting_code.trim(),
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added to history" });
    } catch (e) {
        console.error("[addToHistory]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not save meeting" });
    }
};

export { login, register, getUserHistory, addToHistory };