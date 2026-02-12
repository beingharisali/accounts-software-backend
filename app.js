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


app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "https://accounts-software-frontend.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173"
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// 3. Body Parsers
app.use(express.json({ limit: "10mb" })); // Limit thori barha di hai bulk upload ke liye
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// 4. Rate Limiter
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Thora barha diya taake bulk actions block na hon
    message: "Too many requests, please try again later.",
  })
);

// ✅ ADDED: Health Check Route (Render ke liye zaroori hai)
app.get("/", (req, res) => {
  res.send('<h1>Accounts Software API</h1><p>Status: Online 🚀</p>');
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", message: "Server is running smoothly" });
});

// 5. Routes setup
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/students", studentRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {

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