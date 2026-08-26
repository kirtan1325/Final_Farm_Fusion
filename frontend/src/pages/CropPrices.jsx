// frontend/src/pages/CropPrices.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCropPrices } from "../api/cropPriceService";
import { predictPrice } from "../api/mlService";
import { useAuth } from "../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import SharedSidebar from "../components/SharedSidebar";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const CATEGORIES = ["All", "vegetables", "fruits", "grains", "herbs", "other"];

// Shimmer skeleton row for table
function TableRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <div className="ff-shimmer h-4 rounded w-20" />
        </td>
      ))}
    </tr>
  );
}

// Summary stat cards derived from prices array
function SummaryCards({ prices, loading }) {
  const gainers = prices.filter(p => p.trend === "up").length;
  const losers  = prices.filter(p => p.trend === "down").length;
  const avgModal = prices.length
    ? Math.round(prices.reduce((s, p) => s + p.modalPrice, 0) / prices.length)
    : 0;

  const cards = [
    {
      variant: "emerald",
      icon: "📈",
      label: "Top Gainers",
      value: gainers,
      sub: "crops rising today",
    },
    {
      variant: "amber",
      icon: "💰",
      label: "Avg Modal Price",
      value: prices.length ? `₹${avgModal.toLocaleString()}` : "—",
      sub: "per quintal",
    },
    {
      variant: "blue",
      icon: "📊",
      label: "Total Listed",
      value: prices.length,
      sub: "crops tracked",
    },
    {
      variant: "orange",
      icon: "📉",
      label: "Declining",
      value: losers,
      sub: "crops falling today",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div
          key={c.label}
          className={`ff-stat-card ${c.variant} ff-fade-in ff-stagger-${i + 1}`}
        >
          {loading ? (
            <>
              <div className="ff-shimmer h-4 rounded w-1/2 mb-3" />
              <div className="ff-shimmer h-8 rounded w-1/3 mb-2" />
              <div className="ff-shimmer h-3 rounded w-2/3" />
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                <span>{c.icon}</span> {c.label}
              </p>
              <p className="text-3xl font-extrabold text-gray-900 leading-none my-1">{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CropPrices() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prices,   setPrices]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");

  // Prediction state
  const [showPredict,    setShowPredict]    = useState(false);
  const [predictCrop,    setPredictCrop]    = useState("Wheat");
  const [forecast,       setForecast]       = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError,   setPredictError]   = useState("");

  const dashPath = user?.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category !== "All") params.category = category;
        if (search.trim())      params.search    = search.trim();
        const data = await getCropPrices(params);
        setPrices(data.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    const timer = setTimeout(fetchPrices, search ? 600 : 100);
    return () => clearTimeout(timer);
  }, [category, search]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setPredictLoading(true);
    setPredictError("");
    try {
      const data = await predictPrice({ crop: predictCrop });
      if (data.success) {
        const formatted = data.forecast_30_days.map((val, idx) => ({
          day: `Day ${idx + 1}`,
          price: Math.round(val),
        }));
        setForecast({ ...data, chartData: formatted });
      } else {
        setPredictError("Failed to fetch prediction.");
      }
    } catch {
      setPredictError("ML Service not reachable.");
    } finally {
      setPredictLoading(false);
    }
  };

  const trendColor = (t) => t === "up" ? "text-emerald-600" : t === "down" ? "text-red-500" : "text-gray-400";
  const trendArrow = (t) => t === "up" ? "↑" : t === "down" ? "↓" : "→";
  const trendBg    = (t) => t === "up" ? "bg-emerald-50" : t === "down" ? "bg-red-50" : "bg-gray-50";

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#f8fafc" }}>
      <SharedSidebar activePath="/crop-prices" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* ── Top Bar ── */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden cursor-pointer text-gray-500 hover:text-gray-800 transition-colors">
            <MenuIcon />
          </button>
          <span className="text-xl">📈</span>
          <span className="font-bold text-gray-900 flex-1 text-base">Live Crop Market Prices</span>
          <button
            onClick={() => setShowPredict(true)}
            className="ff-btn ff-btn-primary flex items-center gap-2 text-sm"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            <span>🔮</span> AI Forecast
          </button>
        </header>

        {/* ── AI Prediction Modal ── */}
        {showPredict && (
          <div className="ff-modal-overlay">
            <div className="ff-modal w-full max-w-3xl flex flex-col max-h-[90vh]">
              {/* Modal header */}
              <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>
                <h3 className="text-white font-extrabold text-xl flex items-center gap-2">
                  <span>🔮</span> Smart Price Prediction
                </h3>
                <button
                  onClick={() => setShowPredict(false)}
                  className="text-white hover:text-amber-200 text-2xl leading-none cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handlePredict} className="flex flex-col sm:flex-row gap-3 mb-6 items-end">
                  <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                      Select Crop to Forecast
                    </label>
                    <div className="ff-input-group">
                      <input
                        type="text"
                        value={predictCrop}
                        onChange={e => setPredictCrop(e.target.value)}
                        className="ff-input"
                        placeholder="e.g. Wheat, Rice, Tomato"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={predictLoading}
                    className="ff-btn ff-btn-primary w-full sm:w-auto h-[46px] flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                  >
                    {predictLoading ? (
                      <span className="flex items-center gap-2"><span className="ff-spinner" style={{ width: 16, height: 16 }} /> Forecasting...</span>
                    ) : "Generate 30-Day Forecast"}
                  </button>
                </form>

                {predictError && (
                  <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl mb-4 font-semibold border border-red-100">
                    ⚠ {predictError}
                  </p>
                )}

                {forecast && !predictLoading && (
                  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 ff-fade-in">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="ff-card p-4 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Best Time to Sell</p>
                        <p className="text-xl font-extrabold text-emerald-600">{forecast.best_time_to_sell}</p>
                      </div>
                      <div className="ff-card p-4 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Max Projected Price</p>
                        <p className="text-xl font-extrabold text-amber-600">₹{Math.round(forecast.max_price).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 mb-4 text-center">30-Day Price Forecast (₹ / Quintal)</h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={forecast.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                            <Line type="monotone" dataKey="price" stroke="#d97706" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Main ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl w-full mx-auto">

          {/* Page title */}
          <div className="ff-fade-in ff-stagger-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              <span className="ff-gradient-text">Mandi Prices</span> Today
            </h1>
            <p className="text-sm text-gray-500 mt-1">Today's wholesale crop prices from major mandis across India.</p>
          </div>

          {/* Summary stat cards */}
          <SummaryCards prices={prices} loading={loading} />

          {/* ── Filters ── */}
          <div className="ff-fade-in ff-stagger-2 flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="ff-input-group flex items-center gap-2 flex-1 max-w-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search crop..."
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 cursor-pointer text-sm">✕</button>
              )}
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all capitalize
                    ${category === c
                      ? "text-white border-transparent shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"
                    }`}
                  style={category === c ? { background: "linear-gradient(135deg,#10b981,#059669)" } : {}}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ── Price Table ── */}
          <div className="ff-card overflow-hidden ff-fade-in ff-stagger-3">
            <div className="overflow-x-auto">
              <table className="ff-table">
                <thead>
                  <tr>
                    {["Crop", "Market", "Min Price", "Max Price", "Modal Price", "Trend", "Change"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : prices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">🌾</span>
                          <p className="font-semibold text-gray-500">No prices found</p>
                          <p className="text-xs">Try adjusting your search or category filter.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    prices.map((p, i) => (
                      <tr key={p._id} className="ff-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                        {/* Crop */}
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{p.emoji}</span>
                            <div>
                              <p className="font-bold text-gray-900">{p.cropName}</p>
                              <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                            </div>
                          </div>
                        </td>
                        {/* Market */}
                        <td>
                          <p className="text-gray-700 font-medium">{p.market}</p>
                          <p className="text-xs text-gray-400">{p.state}</p>
                        </td>
                        {/* Min */}
                        <td className="text-gray-600">₹{p.minPrice.toLocaleString()}</td>
                        {/* Max */}
                        <td className="text-gray-600">₹{p.maxPrice.toLocaleString()}</td>
                        {/* Modal */}
                        <td className="font-bold text-gray-900">₹{p.modalPrice.toLocaleString()}</td>
                        {/* Trend */}
                        <td>
                          <span className={`inline-flex items-center gap-1 text-sm font-bold px-2 py-0.5 rounded-full ${trendColor(p.trend)} ${trendBg(p.trend)}`}>
                            <span className="text-base leading-none">{trendArrow(p.trend)}</span>
                            <span className="capitalize text-xs">{p.trend}</span>
                          </span>
                        </td>
                        {/* Change */}
                        <td>
                          <span className={`font-bold text-sm ${p.changePercent > 0 ? "text-emerald-600" : p.changePercent < 0 ? "text-red-500" : "text-gray-400"}`}>
                            {p.changePercent > 0 ? "+" : ""}{p.changePercent}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {!loading && prices.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-400 flex items-center gap-1.5">
                <span>ℹ️</span>
                Prices are indicative. Actual mandi prices may vary. Source: Agmarknet / Local mandis.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
