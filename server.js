const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const { initializeCounter } = require('./utils/initializeCounter'); // Adjust the path as needed

// Load environment variables from .env file
dotenv.config();
const adminRoutes = require("./routes/adminRoutes");

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Initialize the counter
initializeCounter().catch(error => console.error('Failed to initialize counter:', error));

// Routes
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/auth", require("./routes/userRoutes"));
app.use("/api/v1/post", require("./routes/postRoutes"));
app.use("/api/v1/report", require("./routes/reportRoutes"));
app.use("/api/v1/emergency", require("./routes/emergencyRoutes"));

// Set up WebSocket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Make io instance available globally
app.set("io", io);

// Set up the server to listen on the specified port
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`.bgGreen.white);
});
