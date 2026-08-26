// frontend/src/components/NotificationBell.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import { getNotifications, markAsRead, markAllAsRead } from "../api/notificationService";

const TYPE_ICONS = {
  request_received:  "📋",
  request_accepted:  "✅",
  request_rejected:  "❌",
  request_cancelled: "🚫",
  payment_received:  "💰",
  order_shipped:     "🚚",
  order_delivered:   "📦",
  crop_added:        "🌱",
  crop_updated:      "📦",
  crop_removed:      "🗑️",
  farmer_profile_update: "👨‍🌾",
  buyer_message:     "💬",
  system:            "🔔",
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const { unreadCount, refreshCount, latestNotification, setLatestNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Show toast when new notification arrives
  useEffect(() => {
    if (latestNotification) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [latestNotification]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      getNotifications({ limit: 15 })
        .then(data => setNotifications(data.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  const handleClickNotification = async (notif) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        refreshCount();
      } catch {}
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      refreshCount();
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Icon Button ── */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer group"
        aria-label="Notifications"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="text-gray-600 group-hover:text-gray-900 transition-colors">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* ── Red Badge (Instagram-style) ── */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-md animate-bounce-short">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Toast Popup (appears briefly on new notification) ── */}
      {showToast && latestNotification && (
        <div
          onClick={() => {
            setShowToast(false);
            setLatestNotification(null);
            if (latestNotification.link) navigate(latestNotification.link);
          }}
          className="fixed top-4 right-4 z-[100] max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 cursor-pointer
            animate-slide-in-right hover:shadow-3xl transition-shadow"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">
              {TYPE_ICONS[latestNotification.type] || "🔔"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm truncate">{latestNotification.title}</p>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{latestNotification.message}</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowToast(false); setLatestNotification(null); }}
              className="text-gray-300 hover:text-gray-500 text-lg leading-none flex-shrink-0 cursor-pointer"
            >×</button>
          </div>
        </div>
      )}

      {/* ── Dropdown Panel ── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead}
                className="text-xs font-semibold text-green-600 hover:text-green-800 cursor-pointer">
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <svg className="animate-spin w-6 h-6 text-gray-400 mx-auto" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-gray-400">
                <div className="text-4xl mb-2">🔔</div>
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  onClick={() => handleClickNotification(notif)}
                  className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0
                    ${notif.isRead ? "hover:bg-gray-50" : "bg-green-50/50 hover:bg-green-50"}`}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">
                    {TYPE_ICONS[notif.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${notif.isRead ? "text-gray-600" : "text-gray-900 font-semibold"}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-3 text-center">
            <button
              onClick={() => { setOpen(false); navigate("/notifications"); }}
              className="text-sm font-semibold text-green-700 hover:text-green-900 cursor-pointer"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes bounce-short {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        .animate-bounce-short {
          animation: bounce-short 0.4s ease-out;
        }
        @keyframes slide-in-right {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
