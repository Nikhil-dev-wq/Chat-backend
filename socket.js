import express from "express";
import http from "http";
import { Server } from "socket.io";

// ---------------- SETUP SERVER ----------------
const app = express();
const server = http.createServer(app);

// Socket.IO server with CORS enabled
const io = new Server(server, {
    cors: { origin: "https://room-chat-fronted.onrender.com" }
});

// ---------------- MIDDLEWARE ----------------
app.use(express.json());

// ---------------- SOCKET.IO CONNECTION ----------------
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Join room
    socket.on("joinRoom", (roomId, username) => {
        socket.join(roomId);
        console.log(`${username} has joined room ${roomId}`);

        // Notify the user that they joined
        socket.emit("joinedRoom", roomId, username);

        // Notify other users in the room
        socket.to(roomId).emit("userJoin", username);
    });

    // Handle messages
    socket.on("messages", (username, message, roomId) => {
        // Broadcast to everyone else in the room
        socket.broadcast.to(roomId).emit("messages", username, message);
    });
    // Typing indicator
    socket.on("typing", (username, roomId) => {
        // Broadcast to everyone else in the room
        socket.broadcast.to(roomId).emit("typing", username);
    });

    // leave room
    socket.on("userLeave", (username, roomId) => {
        socket.leave(roomId);
        socket.broadcast.to(roomId).emit("userLeave", username);
    });


    // Optional: handle disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// ---------------- START SERVER ----------------
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

