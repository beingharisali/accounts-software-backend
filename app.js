require("dotenv").config({ path: "./.env" });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimiter = require("express-rate-limit");

// DB Connection Import
const connectDB = require("./db/connect");

// Routers Import
const authRouter = require("./routes/auth");
const studentRouter = require("./routes/StudentRoutes");

// Middleware Import
const notFoundMiddleware = require("./middleware/not-found");
const errorHandlerMiddleware = require("./middleware/error-handler");

const app = express();

// 1. Security & Headers
app.use(helmet());

// 2. CORS - Frontend connectivity fix
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080", "http://127.0.0.1:8080"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));

app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: "Too many requests, please try again later.",
  })
);

// 5. Routes setup
app.use("/api/v1/auth", authRouter);
app.use("/api/students", studentRouter);

// 6. Error handlers - Inhein hamesha routes ke baad hona chahiye
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    // Database connect hone ka intezar karein
    console.log("Connecting to MongoDB...");
    await connectDB(process.env.MONGO_URI);

    app.listen(port, () =>
      console.log(`✅ Server is listening on port ${port} and DB is connected...`)
    );
  } catch (error) {
    console.error("❌ Startup Error:", error);
    process.exit(1);
  }
};

start();