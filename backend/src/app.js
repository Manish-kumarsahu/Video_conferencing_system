import 'dotenv/config';
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT || 8000;
app.set("port", PORT);

// ── Middleware ─────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// ── Routes ─────────────────────────────────────────────
app.use("/api/v1/users", userRoutes);

// ── Health check ───────────────────────────────────────
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ── Global Error Handler ───────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error("[Unhandled Error]", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
});

// ── Database + Server Start ────────────────────────────
const start = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB connected: ${connection.connection.host}`);

        server.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB:", err.message);
        process.exit(1);
    }
};

start();