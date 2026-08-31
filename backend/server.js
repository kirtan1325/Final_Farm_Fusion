// backend/server.js
const express   = require("express");
const http      = require("http");
const cors      = require("cors");
const dotenv    = require("dotenv");
const connectDB = require("./config/db");

// ── Load .env FIRST before anything reads process.env ──
dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://final-farm-fusion.vercel.app",
  "https://farm-fusion-eta.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) || 
      origin.endsWith(".vercel.app") ||
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:")
    ) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Passport (loaded AFTER dotenv) ───────────────────────
const passport = require("./config/passport");
app.use(passport.initialize());

// ── Routes ───────────────────────────────────────────────
app.use("/api/auth",          require("./routes/authRoutes"));
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/crops",         require("./routes/cropRoutes"));
app.use("/api/requests",      require("./routes/requestRoutes"));
app.use("/api/orders",        require("./routes/orderRoutes"));
app.use("/api/stats",         require("./routes/statsRoutes"));
app.use("/api/messages",      require("./routes/messageRoutes"));
app.use("/api/upload",        require("./routes/uploadRoutes"));

// V2 — Notifications
app.use("/api/notifications", require("./routes/notificationRoutes"));

// V3 — Useful Tools
app.use("/api/weather",       require("./routes/weatherRoutes"));
app.use("/api/prices",        require("./routes/cropPriceRoutes"));
app.use("/api/schemes",       require("./routes/schemeRoutes"));
app.use("/api/advisory",      require("./routes/advisoryRoutes"));
app.use("/api/inventory",     require("./routes/inventoryRoutes"));
app.use("/api/soil-health",   require("./routes/soilTestRoutes"));

// V4 — Community Forum
app.use("/api/forum",         require("./routes/forumRoutes"));

// V5 — Admin
app.use("/api/admin",         require("./routes/adminRoutes"));

// V6 — AI
app.use("/api/ai",            require("./routes/aiRoutes"));

// ── Health check ─────────────────────────────────────────
app.get("/", (req, res) => res.json({ message: "Farm Fusion API running ✅" }));

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ── Create HTTP server + attach Socket.IO ─────────────────
const PORT = process.env.PORT || 5001;
const server = http.createServer(app);

// Initialize Socket.IO
const { initSocket } = require("./config/socketManager");
initSocket(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`   JWT_SECRET  : ${process.env.JWT_SECRET     ? "set ✅" : "MISSING ❌"}`);
  console.log(`   MONGO_URI   : ${process.env.MONGO_URI      ? "set ✅" : "MISSING ❌"}`);
  console.log(`   CLIENT_URL  : ${process.env.CLIENT_URL     ? "set ✅" : "MISSING ❌"}`);
  console.log(`   WEATHER_KEY : ${process.env.WEATHER_API_KEY && process.env.WEATHER_API_KEY !== "your_openweather_key_here" ? "set ✅" : "mock mode ⚠️"}`);
  console.log(`   Socket.IO   : enabled ✅\n`);

  // Asynchronously connect database in background after port is listening
  connectDB();
});
