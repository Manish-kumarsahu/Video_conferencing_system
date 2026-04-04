import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

export const AuthContext = createContext(null);

// Axios client with base URL and auto-attach of Bearer token
const client = axios.create({
    baseURL: `${server}/api/v1/users`,
});

// Separate client for /api routes (no /v1/users prefix)
const apiClient = axios.create({
    baseURL: `${server}/api`,
});

client.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const AuthProvider = ({ children }) => {
    const router = useNavigate();

    // ── Register ───────────────────────────────────────
    const handleRegister = async (name, username, password) => {
        const request = await client.post("/register", { name, username, password });
        if (request.status === httpStatus.CREATED) {
            return request.data.message;
        }
    };

    // ── Login ──────────────────────────────────────────
    const handleLogin = async (username, password) => {
        const request = await client.post("/login", { username, password });
        if (request.status === httpStatus.OK) {
            localStorage.setItem("token", request.data.token);
            router("/home");
        }
    };

    // ── History ────────────────────────────────────────
    const getHistoryOfUser = async () => {
        const request = await client.get("/get_all_activity");
        return request.data;
    };

    const addToUserHistory = async (meetingCode, transcript = "", summary = "") => {
        await client.post("/add_to_activity", { meeting_code: meetingCode, transcript, summary });
    };

    // ── End Meeting: fetch transcript from DB, summarize via Gemini, save to meetings ──
    const endMeeting = async (meetingCode) => {
        try {
            const res = await apiClient.post("/summarize-meeting", { meetingCode });
            return res.data; // { summary, transcript, message }
        } catch (err) {
            console.error("[endMeeting]", err);
            return { summary: "", transcript: "" };
        }
    };

    // ── Fetch single meeting ──────────────────────────────────────────────────
    const getMeetingDetails = async (meetingCode) => {
        const res = await client.get(`/meeting/${meetingCode}`);
        return res.data;
    };

    // ── Delete single meeting ─────────────────────────────────
    const deleteMeeting = async (id) => {
        await client.delete(`/meeting/${id}`);
    };

    // ── Bulk delete meetings ─────────────────────────────────
    const deleteMeetings = async (ids) => {
        await client.post("/meeting/delete", { ids });
    };

    const value = {
        handleRegister,
        handleLogin,
        getHistoryOfUser,
        addToUserHistory,
        endMeeting,
        getMeetingDetails,
        deleteMeeting,
        deleteMeetings,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Convenience hook
export const useAuth = () => useContext(AuthContext);
