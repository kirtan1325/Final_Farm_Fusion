import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import GoogleTranslate from "./GoogleTranslate";

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const FARMER_LINKS = [
  { label: "Dashboard",      path: "/farmer/dashboard",   icon: "⬛" },
  { label: "Marketplace",    path: "/marketplace",        icon: "🛒" },
  { label: "Requests",       path: "/farmer/requests",    icon: "📋" },
  { label: "Sales",          path: "/farmer/sales",       icon: "💰" },
  { label: "Inventory",      path: "/farmer/inventory",   icon: "📦" },
  { label: "Soil Health",    path: "/farmer/soil-health", icon: "🌱" },
  { label: "Messages",       path: "/messages",           icon: "💬" },
  { label: "Notifications",  path: "/notifications",      icon: "🔔" },
  { label: "Weather",        path: "/weather",            icon: "⛅" },
  { label: "Crop Prices",    path: "/crop-prices",        icon: "📈" },
  { label: "Gov. Schemes",   path: "/schemes",            icon: "🏛" },
  { label: "Crop Advisory",  path: "/advisory",           icon: "💡" },
  { label: "Crop AI",        path: "/crop-recommendation",icon: "🤖" },
  { label: "Disease AI",     path: "/disease-detection",  icon: "🔬" },
  { label: "Forum",          path: "/forum",              icon: "🗣" },
  { label: "Settings",       path: "/farmer/settings",    icon: "⚙" },
];

const BUYER_LINKS = [
  { label: "Dashboard",      path: "/buyer/dashboard",  icon: "⬛" },
  { label: "Marketplace",    path: "/marketplace",      icon: "🛒" },
  { label: "My Orders",      path: "/buyer/orders",     icon: "📦" },
  { label: "Messages",       path: "/messages",         icon: "💬" },
  { label: "Notifications",  path: "/notifications",    icon: "🔔" },
  { label: "Forum",          path: "/forum",            icon: "🗣" },
  { label: "Settings",       path: "/buyer/settings",   icon: "⚙" },
];

// Icon Components
const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconShop = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1-6h16l1 6"/><path d="M3 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0"/><path d="M5 9v11h14V9"/>
  </svg>
);
const IconClipboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
    <rect x="9" y="3" width="6" height="4" rx="2"/>
  </svg>
);
const IconBox = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
  </svg>
);
const IconLeaf = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V12M12 12C12 7 7 3 2 3c0 5 4 9 10 9zM12 12c0-5 5-9 10-9-1 5-5 9-10 9"/>
  </svg>
);
const IconMsg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
);
const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const IconCloud = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/>
  </svg>
);
const IconChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconBuilding = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconBulb = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="22"/>
    <path d="M9 18h6"/><path d="M10 22h4"/>
    <path d="M12 6a6 6 0 00-6 6c0 2.2 1.2 4.2 3 5.4V18h6v-.6c1.8-1.2 3-3.2 3-5.4a6 6 0 00-6-6z"/>
  </svg>
);
const IconRobot = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/><path d="M12 11V5"/>
    <circle cx="12" cy="3" r="2"/>
    <line x1="8" y1="15" x2="8" y2="15"/><line x1="16" y1="15" x2="16" y2="15"/>
  </svg>
);
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconOrders = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);
const IconSales = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const NAV_ICONS = {
  "/farmer/dashboard":    <IconGrid />,
  "/marketplace":         <IconShop />,
  "/farmer/requests":     <IconClipboard />,
  "/farmer/sales":        <IconSales />,
  "/farmer/inventory":    <IconBox />,
  "/farmer/soil-health":  <IconLeaf />,
  "/messages":            <IconMsg />,
  "/notifications":       <IconBell />,
  "/weather":             <IconCloud />,
  "/crop-prices":         <IconChart />,
  "/schemes":             <IconBuilding />,
  "/advisory":            <IconBulb />,
  "/crop-recommendation": <IconRobot />,
  "/disease-detection":   <IconSearch />,
  "/forum":               <IconUsers />,
  "/farmer/settings":     <IconSettings />,
  "/buyer/dashboard":     <IconGrid />,
  "/buyer/orders":        <IconOrders />,
  "/buyer/settings":      <IconSettings />,
};

export default function SharedSidebar({ activePath, open, setOpen, user, onLogout }) {
  const navigate = useNavigate();
  const { badges } = useNotifications();

  const links = user?.role === "farmer" ? FARMER_LINKS : BUYER_LINKS;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`ff-sidebar fixed top-0 left-0 h-full w-64 z-30 flex flex-col
          transition-transform duration-300 ease-in-out overflow-y-auto
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:h-screen lg:flex-shrink-0`}
        style={{ 
          background: "rgba(6, 11, 25, 0.7)", 
          backdropFilter: "blur(20px)",
          borderRight: "1px solid rgba(16, 185, 129, 0.15)"
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold italic shadow-[0_0_15px_rgba(16,185,129,0.4)]"
            style={{ background: "linear-gradient(135deg,#10b981,#00f5ff)" }}>
            🌱
          </div>
          <div>
            <p className="font-extrabold text-white text-sm leading-tight uppercase font-mono tracking-wider">Farm Fusion</p>
            <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-emerald-400 font-mono">
              {user?.role || "Portal"}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 mb-3" style={{ height: "1px", background: "rgba(16,185,129,0.15)" }} />

        {/* Navigation */}
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {links.map((item) => {
            const isActive = activePath === item.path;
            const badgeCount = badges?.[item.path] || 0;
            const icon = NAV_ICONS[item.path];
            return (
              <button
                key={item.path}
                onClick={() => { setOpen(false); navigate(item.path); }}
                className={`ff-nav-item${isActive ? " active" : ""} ff-fade-in font-mono tracking-wide`}
              >
                <span className="ff-nav-icon" style={{ width: 16, flexShrink: 0, color: isActive ? "#fff" : "#10b981" }}>
                  {icon}
                </span>
                <span className="flex-1 text-left text-xs uppercase font-semibold">{item.label}</span>
                {badgeCount > 0 && (
                  <span className="ff-badge ff-badge-red shadow-[0_0_10px_rgba(239,68,68,0.4)]" style={{ fontSize: "0.6rem", padding: "0.1rem 0.35rem" }}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Language Selector */}
        <div className="px-4 mt-2">
          <GoogleTranslate />
        </div>

        {/* User card + Logout */}
        <div className="p-4 mt-2">
          <div className="p-3 rounded-xl mb-2 flex items-center gap-3 bg-black/40 border border-gray-800 shadow-inner">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 font-mono shadow-[0_0_10px_rgba(0,245,255,0.2)]"
              style={{ background: "linear-gradient(135deg,#10b981,#00f5ff)", color: "#000" }}>
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white uppercase tracking-wider truncate font-mono">{user?.name || "User"}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider truncate font-mono text-gray-500 mt-0.5">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={() => { if (onLogout) onLogout(); else navigate("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer font-mono"
            style={{ color: "rgba(239,68,68,0.7)", background: "transparent" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "rgb(239,68,68)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}
          >
            <IconLogout /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
