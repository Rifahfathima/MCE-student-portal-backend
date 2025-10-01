const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const eventRoutes = require("./routes/events");
const achievementRoutes = require("./routes/achievements");

// Import middleware
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ------------------ Security & Performance Middleware ------------------ //
app.use(helmet());
app.use(compression());

// ------------------ Rate Limiting ------------------ //
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: "Too many requests from this IP, please try again later." },
});
app.use("/api/", limiter);

// ------------------ CORS ------------------ //
app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:5173",
      "https://mce-student-portal-frontend-pink.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());

// ------------------ Body Parsing ------------------ //
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ------------------ Logging ------------------ //
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ------------------ Health Check ------------------ //
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MCE Student Portal API is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ------------------ API Routes ------------------ //
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/achievements", achievementRoutes);

// ------------------ Root Route (optional) ------------------ //
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Welcome to MCE Student Portal API!" });
});

// ------------------ 404 Handler ------------------ //
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ------------------ Global Error Handler ------------------ //
app.use(errorHandler);

// ------------------ Database Connection ------------------ //
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1);
  }
};

// ------------------ Start Server ------------------ //
const PORT = process.env.PORT || 5003;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📚 MCE Student Portal API ready for students!`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  });
};

// ------------------ Process Event Handlers ------------------ //
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});

startServer();

module.exports = app;
// ------------------ 404 Handler ------------------ //
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});
