// frontend/src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminStats, getAdminCrops, removeCrop } from "../api/adminService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AdminUsers from "./AdminUsers";
import AdminSchemes from "./AdminSchemes";
import SearchAutocomplete from "../components/SearchAutocomplete";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const ADMIN_TABS = ["Overview", "Users", "Schemes", "Crops", "Forum"];

const TAB_ICONS = {
  Overview: "📊",
  Users:    "👥",
  Schemes:  "🏛️",
  Crops:    "🌾",
  Forum:    "💬",
};

/* ── Shimmer skeleton helper ── */
const ShimmerCard = () => (
  <div className="ff-card p-5 flex flex-col gap-3">
    <div className="ff-shimmer h-4 w-1/2 rounded-full" />
    <div className="ff-shimmer h-8 w-1/3 rounded-full" />
    <div className="ff-shimmer h-3 w-2/3 rounded-full" />
  </div>
);

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab,   setActiveTab]   = useState("Overview");

  // Overview
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Crops tab
  const [crops,       setCrops]       = useState([]);
  const [cropSearch,  setCropSearch]  = useState("");
  const [cropLoading, setCropLoading] = useState(false);

  useEffect(() => {
    getAdminStats().then(d => { setStats(d.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "Crops") return;
    const fetch = async () => {
      setCropLoading(true);
      try {
        const params = {};
        if (cropSearch.trim()) params.search = cropSearch.trim();
        const data = await getAdminCrops(params);
        setCrops(data.data || []);
      } catch { /* silent */ }
      finally { setCropLoading(false); }
    };
    const t = setTimeout(fetch, cropSearch ? 400 : 0);
    return () => clearTimeout(t);
  }, [activeTab, cropSearch]);

  const handleRemoveCrop = async (id, name) => {
    if (!window.confirm(`Remove crop listing "${name}"?`)) return;
    try {
      await removeCrop(id);
      setCrops(prev => prev.filter(c => c._id !== id));
      toast.success("Crop listing removed");
    } catch { toast.error("Failed to remove"); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  /* ── stat card config ── */
  const STAT_CARDS = [
    { label: "Total Users",      value: stats?.totalUsers    ?? 0, icon: "👥", variant: "blue",    stagger: "ff-stagger-1" },
    { label: "Farmers",          value: stats?.totalFarmers  ?? 0, icon: "👨‍🌾", variant: "emerald", stagger: "ff-stagger-2" },
    { label: "Buyers",           value: stats?.totalBuyers   ?? 0, icon: "🛒", variant: "purple",  stagger: "ff-stagger-3" },
    { label: "Pending Approval", value: stats?.pendingFarmers?? 0, icon: "⏳", variant: "amber",   stagger: "ff-stagger-4" },
    { label: "Crop Listings",    value: stats?.totalCrops    ?? 0, icon: "🌾", variant: "emerald", stagger: "ff-stagger-1" },
    { label: "Requests",         value: stats?.totalRequests ?? 0, icon: "📋", variant: "blue",    stagger: "ff-stagger-2" },
    { label: "Schemes",          value: stats?.totalSchemes  ?? 0, icon: "🏛️", variant: "purple",  stagger: "ff-stagger-3" },
    { label: "Forum Posts",      value: stats?.totalPosts    ?? 0, icon: "💬", variant: "orange",  stagger: "ff-stagger-4" },
  ];

  /* ── icon circle colours per variant ── */
  const iconBg = {
    blue:    "linear-gradient(135deg,#3b82f6,#2563eb)",
    emerald: "linear-gradient(135deg,#10b981,#059669)",
    purple:  "linear-gradient(135deg,#8b5cf6,#7c3aed)",
    amber:   "linear-gradient(135deg,#f59e0b,#d97706)",
    orange:  "linear-gradient(135deg,#f97316,#ea580c)",
    red:     "linear-gradient(135deg,#ef4444,#dc2626)",
  };

  /* ── status badge map ── */
  const statusBadge = (status) => {
    if (status === "available") return "ff-badge ff-badge-green";
    if (status === "reserved")  return "ff-badge ff-badge-blue";
    if (status === "sold")      return "ff-badge ff-badge-gray";
    return "ff-badge ff-badge-gray";
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "var(--ff-font)", background: "#F4F6F4" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 lg:hidden"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside
        className={`ff-sidebar fixed top-0 left-0 h-full z-30 flex flex-col justify-between py-6 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:h-screen`}
        style={{ width: "256px", minWidth: "256px" }}
      >
        {/* Top: logo + nav */}
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-lg"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
            >
              <ShieldIcon />
            </div>
            <div>
              <p className="font-bold text-white text-sm tracking-wide">Farm Fusion</p>
              <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Admin Portal</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 px-3">
            {ADMIN_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`ff-nav-item${activeTab === tab ? " active" : ""}`}
                style={activeTab === tab ? { background: "linear-gradient(135deg,#ef4444,#dc2626)" } : {}}
              >
                <span className="text-base">{TAB_ICONS[tab]}</span>
                <span>{tab}</span>
              </button>
            ))}
            <div className="my-2" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
            <button
              onClick={() => navigate("/advisory")}
              className="ff-nav-item"
            >
              <span className="text-base">🌾</span>
              <span>Manage Advisory</span>
            </button>
          </nav>
        </div>

        {/* Bottom: user card + logout */}
        <div className="flex flex-col gap-2 px-3">
          <div
            className="ff-glass flex items-center gap-3 px-3 py-3 rounded-xl"
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow"
              style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)" }}
            >
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs font-semibold" style={{ color: "#f87171" }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="ff-nav-item w-full text-left"
            style={{ color: "#f87171" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.15)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ══════════════ MAIN CONTENT ══════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto" style={{ background: "#f8fafc" }}>

        {/* ── Topbar ── */}
        <header className="ff-topbar sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-800 cursor-pointer"
          >
            <MenuIcon />
          </button>
          <span className="text-xl">🛡️</span>
          <span className="font-bold text-gray-900 flex-1 text-lg">Admin Dashboard</span>
          <span className="ff-badge ff-badge-red font-bold">Admin</span>
        </header>

        {/* ── Main ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl w-full mx-auto">

          {/* Tab pills */}
          <div className="flex flex-wrap gap-2">
            {ADMIN_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer"
                style={
                  activeTab === tab
                    ? { background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", boxShadow: "0 2px 10px rgba(239,68,68,0.35)" }
                    : { background: "#e5e7eb", color: "#6b7280" }
                }
              >
                {TAB_ICONS[tab]} {tab}
              </button>
            ))}
          </div>

          {/* ══ OVERVIEW ══ */}
          {activeTab === "Overview" && (
            loading ? (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => <ShimmerCard key={i} />)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 ff-fade-in">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Platform Overview</h1>
                  <p className="text-sm text-gray-500 mt-1">Full control of Farm Fusion platform.</p>
                </div>

                {/* Stat cards grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {STAT_CARDS.map((s) => (
                    <div
                      key={s.label}
                      className={`ff-stat-card ${s.variant} ff-fade-in ${s.stagger} ff-card-hover`}
                    >
                      {/* coloured icon circle */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 shadow"
                        style={{ background: iconBg[s.variant] ?? "#e5e7eb" }}
                      >
                        {s.icon}
                      </div>
                      <p className="text-3xl font-extrabold text-gray-900 leading-none">{s.value}</p>
                      <p className="text-xs text-gray-500 font-medium mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Pending farmers alert */}
                {stats?.pendingFarmers > 0 && (
                  <div
                    className="ff-card flex items-center gap-4 p-5 ff-fade-in"
                    style={{ borderLeft: "4px solid #f59e0b", background: "#fffbeb" }}
                  >
                    <span className="text-3xl flex-shrink-0">⚠️</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-amber-800">
                        {stats.pendingFarmers} farmer{stats.pendingFarmers !== 1 ? "s" : ""} awaiting approval
                      </p>
                      <p className="text-sm text-amber-600 mt-0.5">Review and approve new farmer registrations.</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("Users")}
                      className="ff-btn flex-shrink-0 text-white text-sm font-semibold px-5 py-2.5 rounded-xl cursor-pointer shadow"
                      style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                    >
                      Review Now
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {/* ══ USERS ══ */}
          {activeTab === "Users" && <AdminUsers />}

          {/* ══ SCHEMES ══ */}
          {activeTab === "Schemes" && <AdminSchemes />}

          {/* ══ CROPS ══ */}
          {activeTab === "Crops" && (
            <div className="flex flex-col gap-5 ff-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-xl font-bold text-gray-900">Manage Crop Listings</h2>
                <div style={{ width: "260px" }} className="z-40">
                  <SearchAutocomplete
                    value={cropSearch}
                    onChange={setCropSearch}
                    fetchSuggestions={async (q) => {
                      return crops.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
                    }}
                    renderItem={(item) => item.name}
                    placeholder="Search crops..."
                  />
                </div>
              </div>

              {cropLoading ? (
                <div className="ff-card p-6 flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="ff-shimmer w-8 h-8 rounded-full" />
                      <div className="ff-shimmer h-4 flex-1 rounded-full" />
                      <div className="ff-shimmer h-4 w-20 rounded-full" />
                      <div className="ff-shimmer h-4 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ff-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="ff-table">
                      <thead>
                        <tr>
                          {["Crop", "Farmer", "Qty", "Price", "Status", "Action"].map(h => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {crops.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-14">
                              <span className="text-4xl block mb-3">🌾</span>
                              <span className="text-gray-400 font-medium">No crops found</span>
                            </td>
                          </tr>
                        ) : crops.map(c => (
                          <tr key={c._id}>
                            <td>
                              <div className="flex items-center gap-2.5">
                                <span className="text-xl">{c.emoji || "🌾"}</span>
                                <div>
                                  <p className="font-semibold text-gray-900">{c.name}</p>
                                  <p className="text-xs text-gray-400 capitalize">{c.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="text-gray-600">{c.farmer?.name || "—"}</td>
                            <td className="text-gray-600">{c.quantity} {c.unit}</td>
                            <td className="font-semibold text-gray-900">₹{c.pricePerUnit}/{c.unit}</td>
                            <td>
                              <span className={`${statusBadge(c.status)} capitalize`}>{c.status}</span>
                            </td>
                            <td>
                              <button
                                onClick={() => handleRemoveCrop(c._id, c.name)}
                                className="ff-btn ff-btn-danger text-xs px-3 py-1.5"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ FORUM ══ */}
          {activeTab === "Forum" && (
            <div className="flex flex-col gap-5 ff-fade-in">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Forum</h2>
                <p className="text-sm text-gray-500 mt-1">Visit the forum to pin/remove posts and reply as an expert.</p>
              </div>
              <div
                className="ff-card p-8 flex flex-col items-center gap-5 text-center"
                style={{ maxWidth: "440px" }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
                >
                  💬
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Forum Management</p>
                  <p className="text-sm text-gray-500 mt-1">Moderate community discussions and expert responses.</p>
                </div>
                <button
                  onClick={() => navigate("/forum")}
                  className="ff-btn text-white font-semibold px-6 py-3 rounded-xl cursor-pointer flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
                >
                  💬 Go to Forum
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
