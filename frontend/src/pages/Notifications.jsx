// frontend/src/pages/Notifications.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../api/notificationService";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SharedSidebar from "../components/SharedSidebar";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const fmtDate    = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// Type → icon + left-border color class
const TYPE_UI = {
  request_received:  { icon: "📋", border: "border-l-blue-400",   unreadBg: "bg-blue-50/60"   },
  request_accepted:  { icon: "✅", border: "border-l-emerald-400", unreadBg: "bg-emerald-50/60" },
  request_rejected:  { icon: "❌", border: "border-l-red-400",     unreadBg: "bg-red-50/60"     },
  request_cancelled: { icon: "🚫", border: "border-l-gray-400",    unreadBg: "bg-gray-50/60"    },
  payment_received:  { icon: "💰", border: "border-l-emerald-400", unreadBg: "bg-emerald-50/60" },
  order_shipped:     { icon: "🚚", border: "border-l-blue-400",    unreadBg: "bg-blue-50/60"    },
  order_delivered:   { icon: "📦", border: "border-l-emerald-400", unreadBg: "bg-emerald-50/60" },
  system:            { icon: "🔔", border: "border-l-amber-400",   unreadBg: "bg-amber-50/60"   },
};

// Shimmer skeleton row
function NotifSkeleton() {
  return (
    <div className="ff-card flex items-start gap-4 p-4 border-l-4 border-l-gray-200">
      <div className="ff-shimmer w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="ff-shimmer h-4 rounded w-1/3" />
        <div className="ff-shimmer h-3 rounded w-2/3" />
        <div className="ff-shimmer h-3 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function Notifications() {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const toast               = useToast();
  const { refreshCount, badges } = useNotifications();

  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all"); // all | unread
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [unreadCount,   setUnreadCount]   = useState(0);

  const dashPath = user?.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filter === "unread") params.unreadOnly = "true";
      const data = await getNotifications(params);
      setNotifications(data.data || []);
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / 15)));
      setUnreadCount(data.unreadCount || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [filter, page]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      refreshCount();
    } catch { toast.error("Failed to mark as read"); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      refreshCount();
      toast.success("All notifications marked as read");
    } catch { toast.error("Failed to mark all as read"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      refreshCount();
    } catch { toast.error("Failed to delete notification"); }
  };

  const handleClickNotification = async (notif) => {
    if (!notif.isRead) await handleMarkRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  // Stagger delay classes
  const staggerClass = (i) => {
    const map = ["ff-stagger-1", "ff-stagger-2", "ff-stagger-3", "ff-stagger-4"];
    return map[i % 4] || "";
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#101415" }}>
      <SharedSidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} activePath="/notifications" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* ── Top Bar ── */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden cursor-pointer text-white hover:text-[#00f4fe] transition-colors">
            <MenuIcon />
          </button>
          <span className="text-xl">🔔</span>
          <span className="font-bold text-white flex-1 text-base">Notifications & System Alerts</span>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="ff-btn ff-btn-secondary text-xs px-3 py-1.5"
            >
              ✓ Mark all read
            </button>
          )}
        </header>

        {/* ── Main ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 max-w-3xl w-full mx-auto">

          {/* Subtitle */}
          <div className="ff-fade-in ff-stagger-1">
            <p className="text-sm text-[#a8cfb9]">
              {unreadCount > 0
                ? <><span className="ff-badge ff-badge-green">{unreadCount} unread</span>&nbsp;notification{unreadCount !== 1 ? "s" : ""}</>
                : <span className="text-[#4ce346] font-medium">✓ All notifications caught up!</span>
              }
            </p>
          </div>

          {/* Filter tabs */}
          <div className="ff-fade-in ff-stagger-2 flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { id: "all",    label: "All" },
              { id: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => { setFilter(f.id); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                  ${filter === f.id
                    ? "bg-white text-emerald-700 shadow font-semibold"
                    : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="flex flex-col gap-3 ff-fade-in">
              {Array.from({ length: 5 }).map((_, i) => <NotifSkeleton key={i} />)}
            </div>
          ) : notifications.length === 0 ? (
            /* Empty state */
            <div className="ff-fade-in flex flex-col items-center justify-center py-24 text-center gap-3">
              <span className="text-6xl ff-float select-none">🔔</span>
              <p className="font-bold text-gray-600 text-xl mt-2">No notifications</p>
              <p className="text-sm text-gray-400">
                {filter === "unread" ? "No unread notifications." : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {notifications.map((notif, i) => {
                const ui = TYPE_UI[notif.type] || TYPE_UI.system;
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClickNotification(notif)}
                    className={`ff-card group relative flex items-start gap-4 p-4 border-l-4 cursor-pointer transition-all
                      ff-fade-in ${staggerClass(i)}
                      ${ui.border}
                      ${!notif.isRead ? ui.unreadBg : "bg-white"}
                    `}
                  >
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-emerald-500 rounded-full flex-shrink-0 ff-badge-pulse" />
                    )}

                    {/* Icon bubble */}
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl flex-shrink-0 shadow-sm">
                      {ui.icon}
                    </div>

                    {/* Text content */}
                    <div className="flex-1 min-w-0 pr-8">
                      <p className={`text-sm leading-snug ${notif.isRead ? "text-gray-700" : "text-gray-900 font-semibold"}`}>
                        <span className="font-bold">{notif.title}</span>
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1.5">{fmtDate(notif.createdAt)}</p>
                    </div>

                    {/* Delete button — appears on hover */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(notif._id); }}
                      className="absolute top-3 right-8 text-gray-300 hover:text-red-500 transition-colors cursor-pointer text-lg leading-none opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 ff-fade-in">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500
                  hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 cursor-pointer transition-all"
              >‹</button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-full text-sm font-semibold cursor-pointer transition-all
                    ${page === p
                      ? "text-white shadow-md"
                      : "border border-gray-200 text-gray-600 hover:border-emerald-400"
                    }`}
                  style={page === p ? { background: "linear-gradient(135deg,#10b981,#059669)" } : {}}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500
                  hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 cursor-pointer transition-all"
              >›</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
