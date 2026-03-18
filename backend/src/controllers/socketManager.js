import { Server } from "socket.io"


let connections = {}
let messages = {}
let timeOnline = {}
// Reverse map: socketId → roomPath for O(1) lookup instead of iterating all rooms
let socketToRoom = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });


    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (path) => {

            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)

            // Track which room this socket belongs to for O(1) lookups
            socketToRoom[socket.id] = path;

            timeOnline[socket.id] = new Date();

            // connections[path].forEach(elem => {
            //     io.to(elem)
            // })

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }

        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {

            // O(1) lookup using the reverse map instead of iterating all rooms
            const matchingRoom = socketToRoom[socket.id];

            if (matchingRoom !== undefined) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("disconnect", () => {

            var diffTime = Math.abs(timeOnline[socket.id] - new Date())
            delete timeOnline[socket.id]

            // O(1) lookup using the reverse map; no need to clone or iterate all rooms
            const key = socketToRoom[socket.id]
            delete socketToRoom[socket.id]

            if (key !== undefined && connections[key] !== undefined) {
                connections[key].forEach((peerId) => {
                    io.to(peerId).emit('user-left', socket.id)
                })

                var index = connections[key].indexOf(socket.id)
                connections[key].splice(index, 1)

                if (connections[key].length === 0) {
                    delete connections[key]
                    delete messages[key]
                }
            }

        })


    })


    return io;
}

