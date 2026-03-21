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

client.interceptors.request.use((config) => {
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

    const addToUserHistory = async (meetingCode) => {
        await client.post("/add_to_activity", { meeting_code: meetingCode });
    };

    const value = {
        handleRegister,
        handleLogin,
        getHistoryOfUser,
        addToUserHistory,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Convenience hook
export const useAuth = () => useContext(AuthContext);
