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
        socket.on("join-room", (roomId, username) => {
            socket.join(roomId);
            
            if (!connections[roomId]) {
                connections[roomId] = [];
            }

            // Assign role: First user is host, others are participants
            const role = connections[roomId].length === 0 ? "host" : "participant";
            
            const userData = {
                socketId: socket.id,
                username: username || `User_${socket.id.substring(0, 4)}`,
                role: role
            };

            connections[roomId].push(userData);
            timeOnline[socket.id] = new Date();

            // Notify all participants of the updated user list
            io.to(roomId).emit("user-joined", socket.id, connections[roomId]);

            // Replay chat history to new joiner
            if (messages[roomId]) {
                messages[roomId].forEach(msg => {
                    io.to(socket.id).emit("receive-message", msg);
                });
            }
        });

        // ── WebRTC signal relay ────────────────────────
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // ── Kick User ──────────────────────────────────
        socket.on("kick-user", (roomId, targetId) => {
            // Verify if the requester is the host of the room
            const roomUsers = connections[roomId] || [];
            const requester = roomUsers.find(u => u.socketId === socket.id);
            
            if (requester && requester.role === "host") {
                // Emit kicked event to the target
                io.to(targetId).emit("kicked");
                
                // The target's socket will likely disconnect or the frontend will handle it.
                // We don't manually remove here because disconnect handler will catch it,
                // but we can force disconnect if needed: io.sockets.sockets.get(targetId)?.disconnect();
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

            for (const [roomKey, roomSockets] of Object.entries(connections)) {
                const idx = roomSockets.findIndex(u => u.socketId === socket.id);
                if (idx === -1) continue;

                const disconnectedUser = roomSockets[idx];
                
                // Remove user from room
                connections[roomKey].splice(idx, 1);

                // If the host left and there are participants, assign a new host
                if (disconnectedUser.role === "host" && connections[roomKey].length > 0) {
                    connections[roomKey][0].role = "host";
                }

                // Notify remaining participants
                connections[roomKey].forEach((user) => {
                    io.to(user.socketId).emit("user-left", socket.id);
                    // Also send updated users list so roles are updated (e.g. new host)
                    io.to(user.socketId).emit("update-users", connections[roomKey]);
                });

                // Clean up empty room
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
