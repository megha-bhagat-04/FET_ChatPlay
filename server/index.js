require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const path = require("path");
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const PORT = process.env.PORT || 5000;

// Routes
const authRoutes = require("./routes/auth");
const socialRoutes = require("./routes/social");
const messagesRoutes = require("./routes/messages");
const friendsRoutes = require("./routes/friends");
const reportsRoutes = require("./routes/reports");
const adminRoutes = require("./routes/admin");
const usersRoutes = require("./routes/users");
const gamesRoutes = require("./routes/games");

const notificationsRoutes = require("./routes/notifications");

app.use("/api/auth", authRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/notifications", notificationsRoutes);

// Simple API Check
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is up and running" });
});

// Socket.io Setup
require("./sockets")(io, pool);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

