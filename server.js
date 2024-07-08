const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const colors = require("colors");
const morgan = require("morgan");
const connectDB = require("./config/db");

// Load environment variables from .env file
dotenv.config();
const adminRoutes = require("./routes/adminRoutes");

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve static files from the uploads directory


// Routes

app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1/auth", require("./routes/userRoutes"));
app.use("/api/v1/post", require("./routes/postRoutes"));
app.use("/api/v1/report", require("./routes/reportRoutes"));
app.use("/api/v1/emergency", require("./routes/emergencyRoutes"));

// Set up the server to listen on the specified port
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`.bgGreen.white);
});
