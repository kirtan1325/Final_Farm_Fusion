import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFarmerOrders, updateOrderStatus } from "../api/orderService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SharedSidebar from "../components/SharedSidebar";
import { 
  TrendingUp, 
  Package, 
  Truck, 
  CheckCircle, 
  DollarSign, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Calendar, 
  User, 
  ArrowLeft,
  ChevronDown
} from "lucide-react";

// Icons for Sidebar compatibility
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const STATUS_OPTIONS = [
  { value: "processing", label: "Processing", color: "#f59e0b", badgeClass: "ff-badge ff-badge-amber" },
  { value: "shipped", label: "Shipped", color: "#3b82f6", badgeClass: "ff-badge ff-badge-blue" },
  { value: "delivered", label: "Delivered", color: "#10b981", badgeClass: "ff-badge ff-badge-green" },
  { value: "cancelled", label: "Cancelled", color: "#ef4444", badgeClass: "ff-badge ff-badge-red" },
];

const FILTER_TABS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function FarmerSales() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFarmerOrders();
      if (res.success) {
        setOrders(res.data);
      } else {
        setError("Failed to fetch sales records.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error loading sales data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}!`);
        // Update local state without full reload
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus, deliveredAt: newStatus === "delivered" ? new Date() : o.deliveredAt } : o));
      } else {
        toast.error("Failed to update status.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Filter & Search
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.crop?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.buyer?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.buyer?.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.transactionId || "").toLowerCase().includes(search.toLowerCase()) ||
      (order._id || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = filter === "All" || order.status === filter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Calculate stats based on all loaded orders
  const stats = orders.reduce((acc, order) => {
    if (order.status !== "cancelled") {
      acc.totalSales += order.totalPrice;
      acc.totalVolume += order.quantity;
      if (order.status === "delivered") {
        acc.completedOrders += 1;
      } else {
        acc.activeOrders += 1;
      }
    }
    return acc;
  }, { totalSales: 0, totalVolume: 0, activeOrders: 0, completedOrders: 0 });

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#050814" }}>
      <SharedSidebar activePath="/farmer/sales" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* ── Topbar ── */}
        <header className="ff-topbar flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 cursor-pointer mr-1 hover:text-white transition-colors">
            <MenuIcon />
          </button>
          
          <button 
            onClick={() => navigate("/farmer/dashboard")}
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors mr-3"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="w-px h-4 bg-gray-800 mr-3" />
          
          <div className="flex items-center gap-2 flex-1">
            <span className="text-lg">💰</span>
            <span className="font-extrabold uppercase font-mono tracking-wider text-white text-sm sm:text-base">Sales Management</span>
          </div>

          {/* Search bar in Topbar */}
          <div className="ff-input-group hidden sm:flex w-64 mr-2">
            <Search size={14} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search sales records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-xs outline-none bg-transparent text-white placeholder-gray-400"
            />
          </div>

          <button onClick={fetchOrders} className="relative w-9 h-9 rounded-xl bg-black/40 border border-gray-800 flex items-center justify-center text-gray-400 hover:bg-gray-800 hover:text-white transition-all cursor-pointer">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        {/* ── Main Body ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          {/* Header Description */}
          <div className="ff-fade-in flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-mono text-white ff-title-glow">
                Farmer Sales Tracker
              </h1>
              <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">
                Monitor and fulfill your pending crop deliveries, manage transactions, and track revenue.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="ff-fade-in bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button onClick={fetchOrders} className="text-xs font-semibold underline cursor-pointer hover:text-red-300 transition-colors">
                Retry
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: "Total Sales",
                value: fmt(stats.totalSales),
                icon: <DollarSign size={22} />,
                variant: "emerald",
                color: "#10b981",
                bg: "rgba(16,185,129,0.1)"
              },
              {
                label: "Volume Sold",
                value: `${stats.totalVolume.toLocaleString()} units`,
                icon: <Package size={22} />,
                variant: "blue",
                color: "#3b82f6",
                bg: "rgba(59,130,246,0.1)"
              },
              {
                label: "Active Orders",
                value: stats.activeOrders,
                icon: <Truck size={22} />,
                variant: "amber",
                color: "#f59e0b",
                bg: "rgba(245,158,11,0.1)"
              },
              {
                label: "Fulfilled Orders",
                value: stats.completedOrders,
                icon: <CheckCircle size={22} />,
                variant: "purple",
                color: "#8b5cf6",
                bg: "rgba(139,92,246,0.1)"
              }
            ].map((stat, i) => (
              <div key={stat.label} className={`ff-stat-card ${stat.variant} ff-fade-in ff-stagger-${i+1}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className="text-xl sm:text-2xl font-black text-white font-mono leading-none">{stat.value}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: stat.bg, color: stat.color }}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controls: Filters & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 ff-fade-in ff-stagger-2 pl-1 sm:pl-2">
            <div className="flex flex-wrap gap-2.5 items-center">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                    filter === tab
                      ? "bg-[#00f4fe] text-[#002021] border-[#00f4fe] shadow-[0_0_15px_rgba(0,244,254,0.4)]"
                      : "bg-[#062c1d]/60 text-[#a8cfb9] border-white/10 hover:border-[#00f4fe]/40 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Mobile Search input */}
            <div className="ff-input-group sm:hidden flex-1">
              <Search size={14} className="text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 text-xs outline-none bg-transparent text-white"
              />
            </div>
          </div>

          {/* Orders Section */}
          {loading ? (
            <div className="ff-card p-6 flex flex-col gap-4">
              <div className="ff-shimmer h-8 w-48 rounded" />
              <div className="flex flex-col gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-800 last:border-0">
                    <div className="ff-shimmer w-12 h-12 rounded-xl flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="ff-shimmer h-4 w-40 rounded" />
                      <div className="ff-shimmer h-3 w-28 rounded" />
                    </div>
                    <div className="ff-shimmer h-4 w-20 rounded" />
                    <div className="ff-shimmer h-6 w-24 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="ff-card p-16 flex flex-col items-center justify-center text-center gap-4 ff-fade-in ff-stagger-3">
              <span className="text-5xl">💰</span>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">No Sales Records Found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-mono uppercase">
                  {orders.length === 0 
                    ? "Once buyers accept your negotiations and make payments, their orders will appear here for you to fulfill."
                    : "No sales match the active filters or search terms."}
                </p>
              </div>
            </div>
          ) : (
            <div className="ff-card ff-fade-in ff-stagger-3 overflow-hidden">
              <div className="ff-section-header px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-black/20">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Order Fulfillments</h2>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5 uppercase">
                    {filteredOrders.length} Order{filteredOrders.length !== 1 ? "s" : ""} active
                  </p>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="ff-table w-full">
                  <thead>
                    <tr>
                      <th>Order details</th>
                      <th>Buyer</th>
                      <th>Quantity</th>
                      <th>Amount</th>
                      <th>Payment details</th>
                      <th>Fulfillment status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => {
                      return (
                        <tr key={order._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
                                {order.crop?.emoji || "🌾"}
                              </div>
                              <div>
                                <p className="font-semibold text-white text-sm">{order.crop?.name || "Crop"}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 font-mono uppercase">
                                  <Calendar size={10} />
                                  <span>{fmtDate(order.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <p className="font-semibold text-white text-sm">{order.buyer?.name || "Buyer"}</p>
                              {order.buyer?.companyName && (
                                <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">{order.buyer.companyName}</p>
                              )}
                            </div>
                          </td>
                          <td className="text-white text-sm font-mono">{order.quantity} {order.crop?.unit || "kg"}</td>
                          <td className="font-bold text-white text-sm font-mono">{fmt(order.totalPrice)}</td>
                          <td>
                            <div className="text-[10px] font-mono text-gray-500 uppercase space-y-0.5">
                              <p><span className="text-gray-600">Method:</span> <span className="text-white font-bold">{order.paymentMethod}</span></p>
                              {order.transactionId && (
                                <p className="truncate max-w-[130px]" title={order.transactionId}>
                                  <span className="text-gray-600">ID:</span> {order.transactionId}
                                </p>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="relative inline-block text-left">
                              <select
                                value={order.status}
                                disabled={updatingId === order._id}
                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                className={`text-[10px] font-bold py-1.5 pl-3.5 pr-8 rounded-full border bg-black font-mono uppercase tracking-wider cursor-pointer outline-none transition-all appearance-none ${
                                  order.status === "delivered"
                                    ? "text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5"
                                    : order.status === "shipped"
                                    ? "text-blue-400 border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5"
                                    : order.status === "cancelled"
                                    ? "text-red-400 border-red-500/30 hover:border-red-500/60 bg-red-500/5"
                                    : "text-amber-400 border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5"
                                }`}
                              >
                                {STATUS_OPTIONS.map(opt => (
                                  <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                                <ChevronDown size={12} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-gray-800">
                {filteredOrders.map(order => {
                  const selectedStatus = STATUS_OPTIONS.find(s => s.value === order.status) || STATUS_OPTIONS[0];
                  return (
                    <div key={order._id} className="p-4 flex flex-col gap-3 hover:bg-emerald-950/5 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl flex-shrink-0">
                            {order.crop?.emoji || "🌾"}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{order.crop?.name || "Crop"}</p>
                            <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">{fmtDate(order.createdAt)}</p>
                          </div>
                        </div>
                        <span className={`${selectedStatus.badgeClass} lowercase font-mono py-1 px-3`}>
                          {selectedStatus.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono uppercase border-t border-b border-gray-900 py-2 my-1">
                        <div>
                          <span className="text-gray-600 block text-[9px] tracking-wider">Buyer</span>
                          <span className="text-white font-semibold">{order.buyer?.name || "Buyer"}</span>
                          {order.buyer?.companyName && (
                            <span className="text-[9px] text-gray-500 block truncate leading-tight mt-0.5">{order.buyer.companyName}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600 block text-[9px] tracking-wider">Fulfillment</span>
                          <span className="text-white font-semibold">{order.quantity} {order.crop?.unit}</span>
                          <span className="text-emerald-400 font-bold block mt-0.5">{fmt(order.totalPrice)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-[9px] font-mono text-gray-600 uppercase">
                          Payment: <span className="text-white font-bold">{order.paymentMethod}</span>
                        </div>

                        <div className="relative">
                          <select
                            value={order.status}
                            disabled={updatingId === order._id}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className={`text-[9px] font-bold py-1 pl-3 pr-7 rounded-full border bg-black font-mono uppercase tracking-wider cursor-pointer outline-none transition-all appearance-none ${
                              order.status === "delivered"
                                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                                : order.status === "shipped"
                                ? "text-blue-400 border-blue-500/30 bg-blue-500/5"
                                : order.status === "cancelled"
                                ? "text-red-400 border-red-500/30 bg-red-500/5"
                                : "text-amber-400 border-amber-500/30 bg-amber-500/5"
                            }`}
                          >
                            {STATUS_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-1.5 flex items-center pointer-events-none text-gray-400">
                            <ChevronDown size={10} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
