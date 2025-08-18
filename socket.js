import server from "./App.js";
import { Server } from "socket.io";
import RoomData from "./RoomData.js";

const io = new Server(server, {
    cors: {
        origin: "https://room-chat-fronted.onrender.com",
        methods: ["GET", "POST"]
    }
});

// Map socket.id → { RoomId, Username } for tracking users
const socketRoomMap = new Map();

io.on("connection", (socket) => {
    console.log(`[CONNECT] User connected: ${socket.id}`);

    // Join room
    socket.on("joinRoom", (RoomId) => {
        if (!RoomId) return;

        if (!RoomData[RoomId]) {
            RoomData[RoomId] = { RoomId, Messages: [], Users: [] };
        }

        socket.join(RoomId);
        socket.emit("messages", RoomData[RoomId].Messages);
        console.log(`[ROOM] ${socket.id} joined room ${RoomId}`);
    });

    // Add user
    socket.on("userAdd", ({ RoomId, Username }) => {
        if (!RoomId || !Username) return;

        if (!RoomData[RoomId]) return;

        if (!RoomData[RoomId].Users.includes(Username)) {
            RoomData[RoomId].Users.push(Username);
        }

        socketRoomMap.set(socket.id, { RoomId, Username });

        const userCount = RoomData[RoomId].Users.length;
        io.to(RoomId).emit("usercount", userCount);

        console.log(`[USER] ${Username} joined room ${RoomId} | Users: ${userCount}`);
    });

    // Receive messages
    socket.on("messages", ({ RoomId, Username, Message }) => {
        if (!RoomId || !Username || !Message) return;

        if (!RoomData[RoomId]) {
            socket.emit("errorMessage", `Room ${RoomId} does not exist!`);
            return;
        }

        const msgData = { Username, Message, timestamp: new Date().toISOString() };
        RoomData[RoomId].Messages.push(msgData);

        io.to(RoomId).emit("messages", msgData);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`[DISCONNECT] User disconnected: ${socket.id}`);

        const userData = socketRoomMap.get(socket.id);
        if (userData) {
            const { RoomId, Username } = userData;

            if (RoomData[RoomId]) {
                RoomData[RoomId].Users = RoomData[RoomId].Users.filter(u => u !== Username);
                const userCount = RoomData[RoomId].Users.length;
                io.to(RoomId).emit("usercount", userCount);
            }

            socketRoomMap.delete(socket.id);
        }
    });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`[SERVER] Running on port ${PORT}`);
});

