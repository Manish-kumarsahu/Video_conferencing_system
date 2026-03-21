import { Server } from "socket.io";

const connections = {};
const messages = {};
const timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        // ── Join call room ─────────────────────────────
        socket.on("join-room", (path) => {
            socket.join(path);
            if (!connections[path]) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = new Date();

            // Notify all participants (including the new joiner) of the full client list
            for (let i = 0; i < connections[path].length; i++) {
                io.to(connections[path][i]).emit("user-joined", socket.id, connections[path]);
            }

            // Replay chat history to new joiner
            if (messages[path]) {
                for (let i = 0; i < messages[path].length; i++) {
                    io.to(socket.id).emit(
                        "receive-message",
                        messages[path][i]
                    );
                }
            }
        });

        // ── WebRTC signal relay ────────────────────────
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });
        // ── Chat message ───────────────────────────────
        socket.on("send-message", ({ roomId, message }) => {
            if (!messages[roomId]) {
                messages[roomId] = [];
            }

            messages[roomId].push(message);

            // Broadcast to all room participants except sender (frontend adds it directly)
            // But user requirement says: io.to(roomId).emit("receive-message", message)
            // To prevent double message on sender, we can use socket.to(roomId).emit.
            // But frontend ensures handle addMessage locally, so socket.to is better. Wait, frontend doesn't addMessage directly?
            // "Frontend receives: socket.on("receive-message", ... setMessages ...)"
            // "Frontend emits: socket.emit("send-message", {roomId, message})"
            // I updated frontend to addMessage directly. So socket.to(roomId).emit is needed to not self-send.
            socket.to(roomId).emit("receive-message", message);
        });

        // ── Disconnect ─────────────────────────────────
        socket.on("disconnect", () => {
            delete timeOnline[socket.id];

            // Find and clean up the room this socket was in
            for (const [roomKey, roomSockets] of Object.entries(connections)) {
                const idx = roomSockets.indexOf(socket.id);
                if (idx === -1) continue;

                // Notify remaining participants
                roomSockets.forEach((participantId) => {
                    io.to(participantId).emit("user-left", socket.id);
                });

                // Remove this socket from the room
                connections[roomKey].splice(idx, 1);

                // Clean up empty room
                if (connections[roomKey].length === 0) {
                    delete connections[roomKey];
                    delete messages[roomKey];
                }

                break; // a socket can only be in one room
            }
        });
    });

    return io;
};
