import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import GoogleTranslate from "./GoogleTranslate";

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const FARMER_NAV_SECTIONS = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", path: "/farmer/dashboard", icon: "📊" },
    ],
  },
  {
    title: "FARM MANAGEMENT",
    items: [
      { label: "Requests", path: "/farmer/requests", icon: "📋" },
      { label: "Sales & Orders", path: "/farmer/sales", icon: "💰" },
      { label: "Inventory", path: "/farmer/inventory", icon: "📦" },
      { label: "Soil Health", path: "/farmer/soil-health", icon: "🌱" },
    ],
  },
  {
    title: "MARKET",
    items: [
      { label: "Marketplace", path: "/marketplace", icon: "🛒" },
      { label: "Mandi Prices", path: "/crop-prices", icon: "📈" },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { label: "Crop Advisory", path: "/advisory", icon: "💡" },
      { label: "Crop Recommendation", path: "/crop-recommendation", icon: "🤖" },
      { label: "Disease Detection", path: "/disease-detection", icon: "🔬" },
      { label: "Weather Forecast", path: "/weather", icon: "⛅" },
    ],
  },
  {
    title: "COMMUNITY & GOV",
    items: [
      { label: "Community Forum", path: "/forum", icon: "🗣" },
      { label: "Messages", path: "/messages", icon: "💬" },
      { label: "Notifications", path: "/notifications", icon: "🔔" },
      { label: "Gov. Schemes", path: "/schemes", icon: "🏛" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Settings", path: "/farmer/settings", icon: "⚙" },
    ],
  },
];

const BUYER_NAV_SECTIONS = [
  {
    title: "MAIN",
    items: [
      { label: "Dashboard", path: "/buyer/dashboard", icon: "📊" },
      { label: "Marketplace", path: "/marketplace", icon: "🛒" },
      { label: "My Orders", path: "/buyer/orders", icon: "📦" },
    ],
  },
  {
    title: "COMMUNITY",
    items: [
      { label: "Messages", path: "/messages", icon: "💬" },
      { label: "Notifications", path: "/notifications", icon: "🔔" },
      { label: "Forum", path: "/forum", icon: "🗣" },
    ],
  },
  {
    title: "ACCOUNT",
    items: [
      { label: "Settings", path: "/buyer/settings", icon: "⚙" },
    ],
  },
];

export default function SharedSidebar({ activePath, open, setOpen, user, onLogout }) {
  const navigate = useNavigate();
  const { badges } = useNotifications();

  const navSections = user?.role === "farmer" ? FARMER_NAV_SECTIONS : BUYER_NAV_SECTIONS;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 flex flex-col justify-between
          transition-transform duration-300 ease-in-out overflow-y-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:h-screen lg:shrink-0`}
      >
        <div>
          {/* Brand Logo & Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 bg-[#0F4C2A] text-white">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-lg shrink-0 font-bold shadow-sm">
              🌱
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-extrabold text-white text-base leading-tight tracking-tight">Farm Fusion</h2>
              <p className="text-[10px] font-semibold text-emerald-200 uppercase tracking-widest mt-0.5">
                AgriTech Platform
              </p>
            </div>
          </div>

          {/* Navigation Sections */}
          <nav className="p-3 space-y-4">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </p>
                {section.items.map((item) => {
                  const isActive = activePath === item.path;
                  const badgeCount = badges?.[item.path] || 0;
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        setOpen(false);
                        navigate(item.path);
                      }}
                      className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-emerald-50 text-[#0F4C2A] border-l-4 border-emerald-600 shadow-xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="text-base shrink-0">{item.icon}</span>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {badgeCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Profile & Language Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-2">
          <div className="px-1">
            <GoogleTranslate />
          </div>

          <div className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0F4C2A] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name || "User"}</p>
              <p className="text-[10px] font-medium text-slate-500 capitalize truncate">{user?.role || "Member"}</p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onLogout) onLogout();
              else navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
