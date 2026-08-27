// frontend/src/context/NotificationContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getNotifications } from "../api/notificationService";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

const NotificationContext = createContext(null);

// Notification sound (short beep)
const playNotificationSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.value = 0.15;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Audio not available
  }
};

export function NotificationProvider({ children }) {
  const { token } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);
  const [badges, setBadges] = useState({});
  const [latestNotification, setLatestNotification] = useState(null); // for toast popup
  const prevUnreadRef = useRef(0);

  const refreshCount = useCallback(async () => {
    if (!token) return;
    try {
      const { data, unreadCount: count } = await getNotifications({ unreadOnly: true, limit: 200 });
      setUnreadCount(count || 0);
      prevUnreadRef.current = count || 0;

      const computedBadges = {};
      if (data && Array.isArray(data)) {
        data.forEach(n => {
          if (n.link) {
             computedBadges[n.link] = (computedBadges[n.link] || 0) + 1;
          }
        });
      }
      setBadges(computedBadges);
    } catch {
      // silent fail
    }
  }, [token]);

  // ── Initial load ──
  useEffect(() => {
    if (!token) { setUnreadCount(0); setBadges({}); return; }
    refreshCount();
  }, [token, refreshCount]);

  // ── Socket.IO real-time listener ──
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification) => {
      console.log("🔔 Real-time notification:", notification);

      // Increment unread count
      setUnreadCount(prev => prev + 1);

      // Update badge for the specific link
      if (notification.link) {
        setBadges(prev => ({
          ...prev,
          [notification.link]: (prev[notification.link] || 0) + 1,
        }));
      }

      // Set latest notification for toast popup
      setLatestNotification(notification);

      // Play sound
      playNotificationSound();
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket]);

  // ── Fallback: poll every 60 seconds (in case socket disconnects) ──
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(refreshCount, 60000);
    return () => clearInterval(interval);
  }, [token, refreshCount]);

  // ── Clear latest notification after 5 seconds (for toast auto-dismiss) ──
  useEffect(() => {
    if (!latestNotification) return;
    const timer = setTimeout(() => setLatestNotification(null), 5000);
    return () => clearTimeout(timer);
  }, [latestNotification]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      badges,
      latestNotification,
      setLatestNotification,
      refreshCount,
      setUnreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
