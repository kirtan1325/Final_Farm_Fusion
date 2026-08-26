// backend/config/socketManager.js
// ─────────────────────────────────────────────────────────
// Centralized Socket.IO manager — maps userId → socket(s)
// ─────────────────────────────────────────────────────────
const jwt  = require("jsonwebtoken");
const User = require("../models/User");

let io = null;

// userId → Set<socketId>
const userSockets = new Map();

/**
 * Initialize Socket.IO with the HTTP server.
 * Called once from server.js after creating the HTTP server.
 */
function initSocket(httpServer) {
  const { Server } = require("socket.io");
  io = new Server(httpServer, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const allowed = [
          process.env.CLIENT_URL,
          "https://farm-fusion-eta.vercel.app",
          "http://localhost:3000",
          "http://localhost:5173",
        ].filter(Boolean);
        if (
          allowed.includes(origin) || 
          origin.endsWith(".vercel.app") ||
          origin.startsWith("http://localhost:") ||
          origin.startsWith("http://127.0.0.1:")
        ) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ── Auth middleware — verify JWT on connect ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.userId;
    console.log(`🟢 Socket connected: ${socket.userName} (${uid})`);

    // Track socket
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);

    // Join personal room (for targeted notifications)
    socket.join(`user:${uid}`);

    // Join role-based room
    socket.join(`role:${socket.userRole}`);

    // ── Client marks notification as read ──
    socket.on("mark_read", (notificationId) => {
      // No need to broadcast — the HTTP API handles DB update
      console.log(`   📖 ${socket.userName} read notification ${notificationId}`);
    });

    // ── Disconnect ──
    socket.on("disconnect", () => {
      console.log(`🔴 Socket disconnected: ${socket.userName} (${uid})`);
      const sockets = userSockets.get(uid);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(uid);
      }
    });
  });

  console.log("   🔌 Socket.IO initialized");
  return io;
}

/**
 * Get the Socket.IO server instance.
 */
function getIO() {
  if (!io) throw new Error("Socket.IO not initialized — call initSocket first");
  return io;
}

/**
 * Send a real-time notification to a specific user.
 * If user is offline, notification is already in DB — they'll see it on next login.
 */
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
}

/**
 * Send a real-time notification to all users of a given role.
 */
function emitToRole(role, event, payload) {
  if (!io) return;
  io.to(`role:${role}`).emit(event, payload);
}

/**
 * Check if a specific user is online.
 */
function isUserOnline(userId) {
  return userSockets.has(userId.toString()) && userSockets.get(userId.toString()).size > 0;
}

module.exports = { initSocket, getIO, emitToUser, emitToRole, isUserOnline };
