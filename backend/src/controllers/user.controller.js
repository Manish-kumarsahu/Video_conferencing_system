import httpStatus from "http-status";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Meeting } from "../models/meeting.model.js";
import { Transcript } from "../models/transcript.model.js";

// ── Login ──────────────────────────────────────────────
const login = async (req, res) => {
    let { username, password, email } = req.body;

    // Fallback logic for testing automation (TestSprite using email instead of username)
    if (!username && email) username = email;

    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Username and password are required" });
    }

    try {
        const user = await User.findOne({ username: username.trim() });
        if (!user) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "User not found", error: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid credentials", error: "Invalid credentials" });
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
    let { name, username, password, email } = req.body;
    
    // Fallback if client doesn't provide a explicit username or display name
    if (!username && email) username = email;

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Invalid email format" });
    }

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

        return res.status(httpStatus.CREATED).json({ 
            message: "Account created successfully",
            userId: newUser._id.toString(),
            user: { 
                id: newUser._id.toString(), 
                userId: newUser._id.toString() 
            }
        });

    } catch (e) {
        console.error("[register]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong. Please try again." });
    }
};

// ── Get History ────────────────────────────────────────
const getUserHistory = async (req, res) => {
    try {
        const meetings = await Meeting.find({ user_id: req.user._id }).sort({ date: -1 });
        
        // Map meetingCode to meetingId to satisfy test assertions
        const mappedMeetings = meetings.map(m => {
            const meetingObj = m.toObject();
            meetingObj.meetingId = meetingObj.meetingCode;
            meetingObj.userId = meetingObj.user_id ? meetingObj.user_id.toString() : null;
            return meetingObj;
        });

        return res.status(httpStatus.OK).json(mappedMeetings);
    } catch (e) {
        console.error("[getUserHistory]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not fetch history" });
    }
};

// ── Add to History ─────────────────────────────────────
const addToHistory = async (req, res) => {
    let { meeting_code, meetingCode, meetingId, participants, summary, transcript } = req.body;
    
    // Fallback if client or tests provide alternative parameter names
    if (!meeting_code && meetingCode) meeting_code = meetingCode;
    if (!meeting_code && meetingId) meeting_code = meetingId;

    if (!meeting_code) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Meeting code is required" });
    }

    const code = meeting_code.trim();

    try {
        // If transcript not provided by client, fetch from transcripts collection
        if (!transcript || !transcript.trim()) {
            const transcriptDocs = await Transcript.find({ meetingCode: code }).sort({ timestamp: 1 });
            if (transcriptDocs.length > 0) {
                transcript = transcriptDocs
                    .map(t => `${t.speakerName || "Unknown"}: ${t.text}`)
                    .join("\n");
            }
        }

        // If summary not provided, check if a meeting record already has one (saved by /api/summarize-meeting)
        if (!summary || !summary.trim()) {
            const existing = await Meeting.findOne({ meetingCode: code, summary: { $ne: "" } }).sort({ date: -1 });
            if (existing) summary = existing.summary;
        }

        const newMeeting = new Meeting({
            user_id: req.user._id,
            meetingCode: code,
            participants: participants || [],
            transcript: transcript || "",
            summary: summary || "",
        });

        await newMeeting.save();

        return res.status(httpStatus.CREATED).json({ message: "Added to history" });
    } catch (e) {
        console.error("[addToHistory]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not save meeting" });
    }
};

// ── Get Single Meeting by Code ──────────────────────────
const getMeetingById = async (req, res) => {
    const { meetingCode } = req.params;
    try {
        const code = meetingCode.trim();

        // First: find the user's own record (may have been saved by addToHistory)
        let meeting = await Meeting.findOne({
            user_id: req.user._id,
            meetingCode: code,
        }).sort({ date: -1 });

        // Fallback: if user record has no content, find any record for this code with content
        if (!meeting || (!meeting.transcript && !meeting.summary)) {
            const richer = await Meeting.findOne({
                meetingCode: code,
                $or: [
                    { transcript: { $ne: "" } },
                    { summary: { $ne: "" } },
                ],
            }).sort({ date: -1 });
            if (richer) meeting = richer;
        }

        if (!meeting) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
        }

        const meetingObj = meeting.toObject();
        meetingObj.meetingId = meetingObj.meetingCode;
        return res.status(httpStatus.OK).json(meetingObj);
    } catch (e) {
        console.error("[getMeetingById]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not fetch meeting" });
    }
};

// ── Delete Single Meeting ──────────────────────────────
const deleteMeeting = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Meeting.findOneAndDelete({ _id: id, user_id: req.user._id });
        if (!result) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "Meeting not found" });
        }
        return res.status(httpStatus.OK).json({ message: "Meeting deleted" });
    } catch (e) {
        console.error("[deleteMeeting]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not delete meeting" });
    }
};

// ── Bulk Delete Meetings ────────────────────────────────
const deleteMeetings = async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "ids array is required" });
    }
    try {
        const result = await Meeting.deleteMany({ _id: { $in: ids }, user_id: req.user._id });
        return res.status(httpStatus.OK).json({ message: `Deleted ${result.deletedCount} meeting(s)` });
    } catch (e) {
        console.error("[deleteMeetings]", e);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Could not delete meetings" });
    }
};

export { login, register, getUserHistory, addToHistory, getMeetingById, deleteMeeting, deleteMeetings };