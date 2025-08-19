import express from "express";
import http from "http";
import { Server } from "socket.io";

// DATABASE SETUP
let roomData = {}

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
        if (!roomData[roomId]) {
            roomData[roomId] = { users: [], messages: [] }
        }

        console.log(`${username} has joined room ${roomId}`);
        // Pushing newuser to database
        if (roomData[roomId].users.includes(username)) {

            socket.emit("error", "User Already Exit");
            return;
        }

        if (!roomData[roomId].users.includes(username)) {
            roomData[roomId]["users"].push(username);
        }

        socket.join(roomId);

        // Notify the user that they joined
        socket.emit("joinedRoom", roomId, username, roomData[roomId]);

        // Notify other users in the room
        socket.to(roomId).emit("userJoin", username);

    });

    // online
    socket.on("online", (username, roomId) => {
        socket.data.username = username; 
        socket.data.roomId = roomId;
        socket.join(roomId);
        socket.emit("roomData", roomData[roomId]);
        socket.broadcast.to(roomId).emit("online", username);
    });



    // Handle messages
    socket.on("messages", (username, message, roomId) => {
        // Pushing data to roomData
        roomData[roomId].messages.push({ name: username, message: message })
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
        roomData[roomId].users = roomData[roomId].users.filter(u => u !== username);
        socket.broadcast.to(roomId).emit("userLeave", username);
    });

    // handle disconnect
    socket.on("disconnect", () => {
        if (socket.data.username && socket.data.roomId) {
            socket.broadcast
                .to(socket.data.roomId)
                .emit("offline", socket.data.username);
        }
    });

});

// ---------------- START SERVER ----------------
const PORT = 5000;
server.listen(PORT);

