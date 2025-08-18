import express from "express";
import cors from "cors";
import http from "http";

// server init
const app = express();
const server = http.createServer(app);

// middleware 
app.use(cors(
  origin: "https://room-chat-fronted.onrender.com",
  methods: ["GET", "POST"],
));
app.use(express.json());


export default server; 
