import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getIncomingRequests, acceptRequest, rejectRequest } from "../api/requestService";
import { getRequestStats } from "../api/statsService";
import { useAuth } from "../context/AuthContext";
import NegotiationModal from "../components/NegotiationModal";
import SharedSidebar from "../components/SharedSidebar";

// ── Icons ──────────────────────────────────────────────
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const ChevRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);


// ── Constants ───────────────────────────────────────────
const TABS = ["All Requests", "Pending", "Accepted", "Rejected"];

const STATUS_UI = {
  pending:  { pill: "bg-yellow-100 text-yellow-800 border border-yellow-200", dot: "bg-yellow-400", label: "Pending"  },
  accepted: { pill: "bg-green-100 text-green-800 border border-green-200",   dot: "bg-green-500",  label: "Accepted" },
  rejected: { pill: "bg-red-100 text-red-700 border border-red-200",         dot: "bg-red-400",    label: "Rejected" },
};

// ── Helpers ─────────────────────────────────────────────
const fmt     = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const avatarColors = [
  { bg: "#dcfce7", tc: "#166534" }, { bg: "#dbeafe", tc: "#1d4ed8" },
  { bg: "#fce7f3", tc: "#9d174d" }, { bg: "#ede9fe", tc: "#5b21b6" },
  { bg: "#fef9c3", tc: "#854d0e" }, { bg: "#ffedd5", tc: "#9a3412" },
  { bg: "#f0fdf4", tc: "#166534" }, { bg: "#fef2f2", tc: "#991b1b" },
];
const getAvatarColor = (name = "") => avatarColors[name.charCodeAt(0) % avatarColors.length];

// ── Status Badge ────────────────────────────────────────
function StatusBadge({ status }) {
  const ffClass = {
    pending:  "ff-badge ff-status-pending",
    accepted: "ff-badge ff-status-accepted",
    rejected: "ff-badge ff-status-rejected",
  }[status] || "ff-badge ff-status-pending";

  const ui = STATUS_UI[status] || STATUS_UI.pending;
  return (
    <span className={ffClass}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block mr-1 ${ui.dot}`} />
      {ui.label}
    </span>
  );
}

// ── Reject Reason Modal ─────────────────────────────────
function RejectModal({ onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <div className="ff-modal-overlay">
      <div className="ff-modal ff-scale-in w-full max-w-md">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <XIcon />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Reject Request</h3>
              <p className="text-xs text-gray-500 mt-0.5">Provide a reason (optional) for the buyer.</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Stock unavailable for requested delivery date..."
            rows={3}
            className="ff-input w-full resize-none"
          />
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onCancel} className="ff-btn ff-btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            className="ff-btn ff-btn-danger flex-1"
          >
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Actions Cell ────────────────────────────────────────
function ActionsCell({ status, onAccept, onReject, onNegotiate, accepting, rejecting }) {
  if (status === "pending") return (
    <div className="flex items-center gap-2">
      <button
        onClick={onAccept}
        disabled={accepting}
        title="Accept"
        className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
      >
        {accepting
          ? <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          : <CheckIcon />}
      </button>
      <button
        onClick={onReject}
        disabled={rejecting}
        title="Reject"
        className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
      >
        <XIcon />
      </button>
      <button
        onClick={onNegotiate}
        className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer transition-colors shadow-sm"
      >
        Chat/Bid
      </button>
    </div>
  );
  if (status === "accepted") return (
    <button className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-emerald-50">
      View Receipt
    </button>
  );
  return <button className="text-xs font-semibold text-gray-400 cursor-pointer px-2 py-1 rounded-lg hover:bg-gray-50">History</button>;
}


// ── Main Component ──────────────────────────────────────
export default function Requestmanagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeNav,    setActiveNav]    = useState("requests");
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activeTab,    setActiveTab]    = useState("Pending");
  const [search,       setSearch]       = useState("");
  const [currentPage,  setCurrentPage]  = useState(1);

  // API state
  const [requests,    setRequests]    = useState([]);
  const [stats,       setStats]       = useState({ pendingValue: 0, acceptedToday: 0, responseRate: "0%" });
  const [tabCounts,   setTabCounts]   = useState({ "All Requests": 0, Pending: 0, Accepted: 0, Rejected: 0 });
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalItems,  setTotalItems]  = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  // Per-row action loading
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [negotiateTarget, setNegotiateTarget] = useState(null);

  const PER_PAGE = 4;

  // Map tab label → API status value
  const tabToStatus = {
    "All Requests": undefined,
    "Pending":  "pending",
    "Accepted": "accepted",
    "Rejected": "rejected",
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reqRes, statsRes, allRes, pendRes, accRes, rejRes] = await Promise.all([
        getIncomingRequests({ status: tabToStatus[activeTab], page: currentPage, limit: PER_PAGE, search: search || undefined }),
        getRequestStats(),
        getIncomingRequests({ limit: 1 }),
        getIncomingRequests({ status: "pending",  limit: 1 }),
        getIncomingRequests({ status: "accepted", limit: 1 }),
        getIncomingRequests({ status: "rejected", limit: 1 }),
      ]);
      setRequests(reqRes.data);
      setTotalPages(reqRes.pages);
      setTotalItems(reqRes.total);
      setStats(statsRes);
      setTabCounts({
        "All Requests": allRes.total,
        "Pending":  pendRes.total,
        "Accepted": accRes.total,
        "Rejected": rejRes.total,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentPage, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchData, search]);

  const handleAccept = async (id) => {
    setAccepting(id);
    try {
      await acceptRequest(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to accept request.");
    } finally {
      setAccepting(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    const id = rejectTarget;
    setRejectTarget(null);
    setRejecting(id);
    try {
      await rejectRequest(id, reason);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setRejecting(null);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#F4F6F4" }}>
      {rejectTarget && <RejectModal onConfirm={handleRejectConfirm} onCancel={() => setRejectTarget(null)} />}
      {negotiateTarget && <NegotiationModal request={negotiateTarget} onClose={() => setNegotiateTarget(null)} isFarmer={true} />}

      <SharedSidebar activePath="/farmer/requests" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* ── Topbar ── */}
        <header className="ff-topbar flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 cursor-pointer mr-1 hover:text-gray-800 transition-colors">
            <MenuIcon />
          </button>

          {/* Brand / Title */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 3h6v4H9z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm sm:text-base">Request Management</span>
          </div>

          {/* Search */}
          <div className="ff-input-group hidden sm:flex w-56">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="flex-1 text-xs outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Notification Bell */}
          <button className="relative w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>

          {/* Info */}
          <button className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </button>
        </header>

        {/* ── Body ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

          {/* Page Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 ff-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
                Purchase Requests
              </h1>
              <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
                Review and manage incoming crop orders from wholesalers and local retailers across the region.
              </p>
            </div>
            <div className="flex gap-2">
              <button className="ff-btn ff-btn-secondary flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="13" y1="18" x2="11" y2="18"/>
                </svg>
                Filter
              </button>
              <button className="ff-btn ff-btn-secondary flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="ff-fade-in flex items-center justify-between px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50"
              style={{ borderLeft: "4px solid #ef4444" }}>
              <span className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </span>
              <button onClick={fetchData} className="text-xs font-bold underline cursor-pointer ml-4 hover:text-red-900">Retry</button>
            </div>
          )}

          {/* ── Pill Tab Strip ── */}
          <div className="ff-fade-in flex items-center gap-2 overflow-x-auto pb-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer"
                  style={isActive
                    ? { background: "linear-gradient(135deg,#10b981,#059669)", color: "#ffffff", boxShadow: "0 2px 8px rgba(16,185,129,0.35)" }
                    : { background: "transparent", color: "#6b7280" }
                  }
                >
                  {tab}
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={isActive
                      ? { background: "rgba(255,255,255,0.25)", color: "#ffffff" }
                      : { background: "#f3f4f6", color: "#9ca3af" }
                    }
                  >
                    {tabCounts[tab] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile search */}
          <div className="sm:hidden ff-input-group">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* ── Table Card ── */}
          <div className="ff-card ff-fade-in overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="ff-table">
                <thead>
                  <tr>
                    {["Buyer Details", "Product", "Quantity", "Total Price", "Date Received", "Status", "Actions"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <div className="ff-spinner mx-auto" />
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-400">
                        <div className="text-4xl mb-3">📋</div>
                        <p className="font-semibold text-gray-500">No requests found</p>
                        <p className="text-xs mt-1 text-gray-400">
                          {search ? "Try a different search term." : `No ${activeTab.toLowerCase()} requests yet.`}
                        </p>
                      </td>
                    </tr>
                  ) : requests.map(r => {
                    const color = getAvatarColor(r.buyer?.name || "");
                    return (
                      <tr key={r._id}>
                        {/* Buyer */}
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: color.bg, color: color.tc }}
                            >
                              {getInitials(r.buyer?.name)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{r.buyer?.name || "—"}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{r.buyer?.companyName || "Buyer"}</p>
                            </div>
                          </div>
                        </td>
                        {/* Product */}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{r.crop?.emoji || "🌾"}</span>
                            <span className="font-semibold text-gray-800">{r.crop?.name || "—"}</span>
                          </div>
                        </td>
                        {/* Quantity */}
                        <td className="text-gray-600">{r.quantity} {r.unit}</td>
                        {/* Price */}
                        <td className="font-bold text-gray-900">{fmt(r.totalPrice)}</td>
                        {/* Date */}
                        <td className="text-gray-500 text-xs whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                        {/* Status */}
                        <td><StatusBadge status={r.status} /></td>
                        {/* Actions */}
                        <td>
                          <ActionsCell
                            status={r.status}
                            onAccept={() => handleAccept(r._id)}
                            onReject={() => setRejectTarget(r._id)}
                            onNegotiate={() => setNegotiateTarget(r)}
                            accepting={accepting === r._id}
                            rejecting={rejecting === r._id}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer + pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {loading
                  ? "Loading..."
                  : `Showing ${Math.min((currentPage - 1) * PER_PAGE + 1, totalItems)}–${Math.min(currentPage * PER_PAGE, totalItems)} of ${totalItems} request${totalItems !== 1 ? "s" : ""}`
                }
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevLeft />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className="w-8 h-8 rounded-full text-sm font-semibold transition-all cursor-pointer"
                      style={currentPage === p
                        ? { background: "linear-gradient(135deg,#10b981,#059669)", color: "#ffffff", boxShadow: "0 2px 6px rgba(16,185,129,0.4)" }
                        : { border: "1px solid #e5e7eb", color: "#6b7280" }
                      }
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevRight />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "📋",
                variant: "emerald",
                label: "Pending Value",
                value: fmt(stats.pendingValue),
                stagger: "ff-stagger-1",
              },
              {
                icon: "✅",
                variant: "blue",
                label: "Accepted Today",
                value: `${stats.acceptedToday} Request${stats.acceptedToday !== 1 ? "s" : ""}`,
                stagger: "ff-stagger-2",
              },
              {
                icon: "📊",
                variant: "purple",
                label: "Response Rate",
                value: stats.responseRate,
                stagger: "ff-stagger-3",
              },
            ].map(s => (
              <div key={s.label} className={`ff-stat-card ${s.variant} ff-fade-in ${s.stagger}`}>
                <div className="flex items-center gap-4 pt-2">
                  <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>
                      {s.label}
                    </p>
                    <p className="text-2xl font-extrabold text-white">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}
