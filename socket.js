import server from "./App.js";
import { Server } from "socket.io";
import RoomData from "./RoomData.js";

const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("joinRoom", (RoomId) => {
        if (!RoomData[RoomId]) {
            RoomData[RoomId] = { RoomId: RoomId, Messages: [], Users: [] }
        }

        socket.join(RoomId);

        socket.emit("messages", RoomData[RoomId].Messages);
    });

    socket.on("messages", ({ RoomId, Username, Message }) => {
        if (!RoomData[RoomId]) {
            socket.emit("errorMessage", `Room ${RoomId} does not exist!`);
            return;
        }

        const msgData = { Username, Message };
        RoomData[RoomId]["Messages"].push(msgData);

        io.to(RoomId).emit("messages", msgData);
    });

    socket.on("userAdd", ({RoomId, Username}) => {
        if (!RoomData[RoomId]["Users"].includes(Username)) {
            RoomData[RoomId]["Users"].push(Username);
        }

        console.log(`User ${Username} joined room ${RoomId}`);
        const userCount = RoomData[RoomId]["Users"].length;
        io.to(RoomId).emit("usercount", userCount);
    });



    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

server.listen(8080, () => {
    console.log("Server running on port 8080");
});
