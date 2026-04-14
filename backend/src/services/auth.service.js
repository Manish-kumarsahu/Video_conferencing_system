import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { generateToken } from "../utils/jwt.js";
import { sendOTPEmail } from "../utils/email.js";

// ── Helpers ────────────────────────────────────────────
export const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

/** Generate a random 6-digit OTP string */
export const generateOTP = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

export const AuthService = {
    async sendOTP(email) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await User.findOne({ email: normalizedEmail });
        
        if (existing && existing.isVerified) {
            throw new Error("ACCOUNT_EXISTS");
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await User.findOneAndUpdate(
            { email: normalizedEmail },
            { $set: { otp, otpExpiry, isVerified: false } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await sendOTPEmail(normalizedEmail, otp);
        return normalizedEmail;
    },

    async verifyOTP(email, otp) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            throw new Error("NOT_FOUND");
        }
        if (!user.otp || !user.otpExpiry) {
            throw new Error("NO_OTP");
        }
        if (new Date() > user.otpExpiry) {
            throw new Error("EXPIRED_OTP");
        }
        if (user.otp !== otp.trim()) {
            throw new Error("INVALID_OTP");
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();
        
        return user;
    },

    async register(email, name, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            throw new Error("NO_OTP_COMPLETED");
        }
        if (!user.isVerified) {
            throw new Error("NOT_VERIFIED");
        }
        if (user.password) {
            throw new Error("ACCOUNT_EXISTS");
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        user.name = name.trim();
        user.password = hashedPassword;
        await user.save();

        const token = generateToken(user._id.toString());
        return { user, token };
    },

    async login(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user || !user.password) {
            throw new Error("INVALID_CREDENTIALS");
        }
        if (!user.isVerified) {
            throw new Error("NOT_VERIFIED");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            throw new Error("INVALID_CREDENTIALS");
        }

        const token = generateToken(user._id.toString());
        return { user, token };
    }
};
