import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../api/notificationService";
import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Notifications() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshCount } = useNotifications();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = { limit: 30 };
      if (filter === "unread") params.unreadOnly = "true";
      const data = await getNotifications(params);
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      refreshCount();
    } catch (err) {
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      refreshCount();
      toast.success("All notifications marked as read.");
    } catch (err) {
      toast.error("Failed to mark all as read.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      refreshCount();
    } catch (err) {
      toast.error("Failed to delete notification.");
    }
  };

  return (
    <AppShell
      activePath="/notifications"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Notifications & System Activity"
      subtitle="Real-time alerts for crop purchase requests, payment updates, and order shipments."
      headerActions={
        unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </Button>
        )
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Filter Toggle */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[#0F4C2A] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "unread"
                ? "bg-[#0F4C2A] text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">🔔</span>}
            title="No notifications"
            description="You are all caught up! New alerts will appear here in real-time."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card
                key={notif._id}
                className={`transition-all ${
                  !notif.isRead ? "border-l-4 border-l-[#0F4C2A] bg-emerald-50/20" : ""
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl shrink-0">🔔</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{notif.title}</h4>
                        {!notif.isRead && <Badge variant="emerald">New</Badge>}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{fmtDate(notif.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!notif.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => handleMarkRead(notif._id)}>
                        Mark Read
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => handleDelete(notif._id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
