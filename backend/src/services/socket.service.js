import { Server } from "socket.io";
import { DeepgramClient } from "@deepgram/sdk";
import { Transcript } from "../models/transcript.model.js";

const connections = {};
const messages = {};
const timeOnline = {};
const deepgramClients = {};

const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(url => url.replace(/\/$/, ''))
    : ["http://localhost:3000"];

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
                    callback(null, true);
                } else {
                    // Reflected dynamically to fix CORS blocks for testing
                    callback(null, true);
                }
            },
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        // ── Join call room ─────────────────────────────
        socket.on("join-room", (roomId, username) => {
            socket.join(roomId);

            if (!connections[roomId]) {
                connections[roomId] = [];
            }

            const role = connections[roomId].length === 0 ? "host" : "participant";

            const userData = {
                socketId: socket.id,
                username: username || `User_${socket.id.substring(0, 4)}`,
                role: role
            };

            connections[roomId].push(userData);
            timeOnline[socket.id] = new Date();

            io.to(roomId).emit("user-joined", socket.id, connections[roomId]);

            if (messages[roomId]) {
                messages[roomId].forEach(msg => {
                    io.to(socket.id).emit("receive-message", msg);
                });
            }
        });

        // ── Media & Speaking Status Relay ────────────────
        socket.on("media-status", ({ roomId, micOn, videoOn }) => {
            socket.to(roomId).emit("media-status", { socketId: socket.id, micOn, videoOn });
        });

        socket.on("speaking-status", ({ roomId, isSpeaking }) => {
            socket.to(roomId).emit("speaking-status", { socketId: socket.id, isSpeaking });
        });

        // ── WebRTC signal relay ────────────────────────
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // ── Kick User ──────────────────────────────────
        socket.on("kick-user", (roomId, targetId) => {
            const roomUsers = connections[roomId] || [];
            const requester = roomUsers.find(u => u.socketId === socket.id);
            if (requester && requester.role === "host") {
                io.to(targetId).emit("kicked");
            }
        });

        // ── Host Controls ──────────────────────────────
        socket.on("mute-all", (roomId) => {
            const roomUsers = connections[roomId] || [];
            const requester = roomUsers.find(u => u.socketId === socket.id);
            if (requester && requester.role === "host") {
                socket.to(roomId).emit("force-mute");
            }
        });

        socket.on("stop-video-all", (roomId) => {
            const roomUsers = connections[roomId] || [];
            const requester = roomUsers.find(u => u.socketId === socket.id);
            if (requester && requester.role === "host") {
                socket.to(roomId).emit("force-stop-video");
            }
        });

        socket.on("end-meeting-all", (roomId) => {
            const roomUsers = connections[roomId] || [];
            const requester = roomUsers.find(u => u.socketId === socket.id);
            if (requester && requester.role === "host") {
                io.to(roomId).emit("meeting-ended");
            }
        });

        // ── Deepgram Captions ──────────────────────────
        socket.on("start-captions", async (roomId, username) => {
            if (deepgramClients[socket.id]) return;

            const apiKey = process.env.DEEPGRAM_API_KEY;
            if (!apiKey) {
                console.error("[Deepgram] DEEPGRAM_API_KEY is missing!");
                socket.emit("transcription-error", { message: "Server transcription configuration error." });
                return;
            }

            console.log(`[Deepgram] Initializing for socket ${socket.id}, room: ${roomId}, user: ${username}`);
            console.log(`[Deepgram] API key: ${apiKey ? "Present ✅" : "Missing ❌"}`);

            try {
                // ✅ Correct SDK v5 (Fern): DeepgramClient with apiKey option
                const deepgram = new DeepgramClient({ apiKey });

                // connect() creates the socket but does NOT open it yet (startClosed: true)
                const dgClient = await deepgram.listen.v1.connect({
                    model: "nova-2",
                    smart_format: true,
                    interim_results: true,
                    encoding: "linear16",
                    sample_rate: 16000,
                    channels: 1,
                    punctuate: true,
                    language: "en-US",
                });

                deepgramClients[socket.id] = dgClient;

                // ✅ Event names are plain strings: "open", "message", "error", "close"
                dgClient.on("open", () => {
                    console.log(`[Deepgram] ✅ WebSocket Connected for socket ${socket.id}`);
                });

                dgClient.on("message", async (data) => {
                    // Guard: only handle transcription results
                    if (data?.type !== "Results") return;

                    const alt = data?.channel?.alternatives?.[0];
                    if (alt && alt.transcript && alt.transcript.trim() !== "") {
                        const isFinal = data.is_final;
                        

                        const transcriptData = {
                            socketId: socket.id,
                            speakerName: username,
                            text: alt.transcript,
                            isFinal,
                        };

                        io.to(roomId).emit("transcript", transcriptData);

                        if (isFinal) {
                            try {
                                await Transcript.create({
                                    meetingCode: roomId,
                                    socketId: socket.id,
                                    speakerName: username,
                                    text: alt.transcript,
                                    timestamp: new Date(),
                                });
                            } catch (err) {
                                console.error("[Deepgram DB Error]", err);
                            }
                        }
                    }
                });

                dgClient.on("error", (err) => {
                    console.error(`[Deepgram] Error for socket ${socket.id}:`, err);
                    socket.emit("transcription-error", { message: "Transcription error occurred." });
                });

                dgClient.on("close", () => {
                    console.log(`[Deepgram] Connection closed for socket ${socket.id}`);
                    delete deepgramClients[socket.id];
                });

                // ✅ Must call .connect() to actually open the WebSocket
                // (SDK creates it with startClosed: true)
                dgClient.connect();

            } catch (err) {
                console.error("[Deepgram Init Error]", err);
                socket.emit("transcription-error", { message: "Failed to initialize transcription service." });
            }
        });

        // ── Audio Stream ──────────────────────────────
        socket.on("audio-stream", (audioData) => {
            const dgClient = deepgramClients[socket.id];
            // ✅ Use readyState (property) and sendMedia() — correct SDK v5 methods
            if (dgClient && dgClient.readyState === 1) {
                dgClient.sendMedia(audioData);
                // Uncomment below to debug audio chunk sizes:
                // console.log(`[Deepgram] Sending audio chunk, size: ${audioData.byteLength} bytes`);
            } 
        });

        socket.on("stop-captions", () => {
            const dgClient = deepgramClients[socket.id];
            if (dgClient) {
                console.log(`[Deepgram] Stopping captions for socket ${socket.id}`);
                try { dgClient.close(); } catch (e) { /* ignore */ }
                delete deepgramClients[socket.id];
            }
        });

        // ── Chat message ───────────────────────────────
        socket.on("send-message", ({ roomId, message }) => {
            if (!messages[roomId]) {
                messages[roomId] = [];
            }
            messages[roomId].push(message);
            socket.to(roomId).emit("receive-message", message);
        });

        // ── Disconnect ─────────────────────────────────
        socket.on("disconnect", () => {
            delete timeOnline[socket.id];

            if (deepgramClients[socket.id]) {
                console.log(`[Deepgram] Cleaning up for disconnected socket ${socket.id}`);
                try { deepgramClients[socket.id].close(); } catch (e) { /* ignore */ }
                delete deepgramClients[socket.id];
            }

            for (const [roomKey, roomSockets] of Object.entries(connections)) {
                const idx = roomSockets.findIndex(u => u.socketId === socket.id);
                if (idx === -1) continue;

                const disconnectedUser = roomSockets[idx];
                connections[roomKey].splice(idx, 1);

                if (disconnectedUser.role === "host" && connections[roomKey].length > 0) {
                    connections[roomKey][0].role = "host";
                }

                connections[roomKey].forEach((user) => {
                    io.to(user.socketId).emit("user-left", socket.id);
                    io.to(user.socketId).emit("update-users", connections[roomKey]);
                });

                if (connections[roomKey].length === 0) {
                    delete connections[roomKey];
                    delete messages[roomKey];
                }

                break;
            }
        });
    });

    return io;
};
