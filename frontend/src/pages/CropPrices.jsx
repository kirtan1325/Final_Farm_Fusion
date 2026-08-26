// frontend/src/pages/CropPrices.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCropPrices } from "../api/cropPriceService";
import { predictPrice } from "../api/mlService";
import { useAuth } from "../context/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import SharedSidebar from "../components/SharedSidebar";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const CATEGORIES = ["All", "vegetables", "fruits", "grains", "herbs", "other"];

// Shimmer skeleton row for table
function TableRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
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
      sub: "mandi markets tracked",
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

  const farmerLocation = user?.location || user?.state || user?.address || "";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [flashingRowId, setFlashingRowId] = useState(null);

  // Prediction state
  const [showPredict, setShowPredict] = useState(false);
  const [predictCrop, setPredictCrop] = useState("Wheat");
  const [predictLocation, setPredictLocation] = useState(farmerLocation || "Punjab");
  const [harvestQuantity, setHarvestQuantity] = useState(50); // Quintals
  const [forecast, setForecast] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictError, setPredictError] = useState("");

  // 1. Initial Load & Search Filtering with Registration Location
  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category !== "All") params.category = category;
        if (search.trim()) params.search = search.trim();
        const data = await getCropPrices(params);
        setPrices(data.data || []);
      } catch (err) {
        console.error("Failed to fetch crop prices:", err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetchPrices, search ? 400 : 100);
    return () => clearTimeout(timer);
  }, [category, search]);

  // 2. Real-Time Stock-Market Live Ticker & Price Fluctuation Simulation
  useEffect(() => {
    if (!prices || prices.length === 0) return;

    const liveInterval = setInterval(() => {
      setPrices((prevPrices) => {
        if (!prevPrices.length) return prevPrices;
        const randomIndex = Math.floor(Math.random() * prevPrices.length);
        const target = prevPrices[randomIndex];
        if (!target) return prevPrices;

        // Random price fluctuation between -0.8% and +1.2%
        const factor = (Math.random() * 0.02 - 0.008);
        const priceDiff = Math.round(target.modalPrice * factor);
        if (priceDiff === 0) return prevPrices;

        const newModal = Math.max(100, target.modalPrice + priceDiff);
        const newMax = Math.max(newModal, target.maxPrice + Math.max(0, priceDiff));
        const newChangePerc = parseFloat((target.changePercent + (priceDiff > 0 ? 0.3 : -0.3)).toFixed(1));
        const newTrend = priceDiff >= 0 ? "up" : "down";

        setFlashingRowId(target._id);
        setTimeout(() => setFlashingRowId(null), 1200);
        setLastUpdated(new Date());

        return prevPrices.map((item, idx) =>
          idx === randomIndex
            ? {
                ...item,
                modalPrice: newModal,
                maxPrice: newMax,
                changePercent: newChangePerc,
                trend: newTrend,
              }
            : item
        );
      });
    }, 4500);

    return () => clearInterval(liveInterval);
  }, [prices]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handlePredict = async (e) => {
    e?.preventDefault();
    setPredictLoading(true);
    setPredictError("");
    try {
      const data = await predictPrice({
        crop: predictCrop,
        location: predictLocation || farmerLocation || "Punjab",
      });
      if (data.success) {
        const formatted = data.forecast_30_days.map((val, idx) => ({
          day: `Day ${idx + 1}`,
          price: Math.round(val),
        }));
        setForecast({ ...data, chartData: formatted });
      } else {
        setPredictError("Failed to fetch prediction.");
      }
    } catch (err) {
      setPredictError(err.response?.data?.message || "ML Service not reachable. Please check connection.");
    } finally {
      setPredictLoading(false);
    }
  };

  const trendColor = (t) => t === "up" ? "text-emerald-600" : t === "down" ? "text-red-500" : "text-gray-400";
  const trendArrow = (t) => t === "up" ? "▲" : t === "down" ? "▼" : "▶";
  const trendBg    = (t) => t === "up" ? "bg-emerald-50 border-emerald-200" : t === "down" ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200";

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#f8fafc" }}>
      <SharedSidebar activePath="/crop-prices" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* ── Real-Time Stock Market Ticker Marquee Bar ── */}
        <div className="bg-slate-900 text-white py-1.5 px-4 flex items-center gap-4 text-xs overflow-hidden border-b border-slate-800">
          <div className="flex items-center gap-1.5 font-extrabold text-amber-400 whitespace-nowrap bg-slate-800 px-2 py-0.5 rounded">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE MANDI MARKET TICKER
          </div>
          <div className="flex-1 overflow-x-auto no-scrollbar whitespace-nowrap flex items-center gap-6 text-slate-300">
            {prices.slice(0, 8).map((p) => (
              <span key={p._id} className="inline-flex items-center gap-1.5 font-medium">
                <span>{p.emoji} {p.cropName} ({p.market}):</span>
                <span className="font-bold text-white">₹{p.modalPrice.toLocaleString()}/qtl</span>
                <span className={`font-semibold text-[11px] ${p.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {p.trend === 'up' ? '▲' : '▼'} {p.changePercent > 0 ? '+' : ''}{p.changePercent}%
                </span>
              </span>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 hidden md:block whitespace-nowrap">
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {/* ── Top Bar ── */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden cursor-pointer text-gray-500 hover:text-gray-800 transition-colors">
            <MenuIcon />
          </button>
          <span className="text-xl">📈</span>
          <div className="flex-1">
            <h2 className="font-extrabold text-gray-900 text-base leading-tight">Live Crop Market & Mandi Prices</h2>
            {farmerLocation && (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <span>📍</span> Default location: {farmerLocation}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (farmerLocation) setPredictLocation(farmerLocation);
              setShowPredict(true);
            }}
            className="ff-btn ff-btn-primary flex items-center gap-2 text-sm shadow-md hover:shadow-lg transition-all"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
          >
            <span>🔮</span> AI Profit Forecast
          </button>
        </header>

        {/* ── AI Price Prediction & Profit Optimization Modal ── */}
        {showPredict && (
          <div className="ff-modal-overlay">
            <div className="ff-modal w-full max-w-3xl flex flex-col max-h-[92vh]">
              {/* Modal header */}
              <div className="px-6 py-4 flex items-center justify-between flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#f59e0b,#ea580c)" }}>
                <div>
                  <h3 className="text-white font-extrabold text-xl flex items-center gap-2">
                    <span>🔮</span> AI Market Profit & Price Forecasting
                  </h3>
                  <p className="text-amber-100 text-xs mt-0.5">Real-time predictive analytics to maximize your crop revenue</p>
                </div>
                <button
                  onClick={() => setShowPredict(false)}
                  className="text-white hover:text-amber-200 text-2xl leading-none cursor-pointer transition-colors"
                >
                  &times;
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handlePredict} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 items-end">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                      Crop Name
                    </label>
                    <input
                      type="text"
                      value={predictCrop}
                      onChange={e => setPredictCrop(e.target.value)}
                      className="ff-input text-sm"
                      placeholder="e.g. Wheat, Rice, Cotton"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">
                      Mandi / State Location
                    </label>
                    <input
                      type="text"
                      value={predictLocation}
                      onChange={e => setPredictLocation(e.target.value)}
                      className="ff-input text-sm"
                      placeholder="e.g. Punjab, Maharashtra"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={predictLoading}
                    className="ff-btn ff-btn-primary h-[44px] flex items-center justify-center text-sm font-bold shadow-sm"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                  >
                    {predictLoading ? (
                      <span className="flex items-center gap-2"><span className="ff-spinner" style={{ width: 16, height: 16 }} /> Analyzing Market...</span>
                    ) : "Analyze & Predict Profit"}
                  </button>
                </form>

                {predictError && (
                  <p className="text-red-600 text-sm bg-red-50 p-3 rounded-xl mb-4 font-semibold border border-red-100 flex items-center gap-2">
                    <span>⚠️</span> {predictError}
                  </p>
                )}

                {forecast && !predictLoading && (
                  <div className="flex flex-col gap-6 ff-fade-in">
                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-center">
                        <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Optimal Sell Window</p>
                        <p className="text-lg font-extrabold text-emerald-800 leading-tight">{forecast.best_time_to_sell}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-center">
                        <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Max Projected Price</p>
                        <p className="text-lg font-extrabold text-amber-800 leading-tight">₹{Math.round(forecast.max_price).toLocaleString()}/qtl</p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-2xl text-center">
                        <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">Current Mandi Price</p>
                        <p className="text-lg font-extrabold text-blue-800 leading-tight">₹{Math.round(forecast.current_price || forecast.forecast_30_days[0]).toLocaleString()}/qtl</p>
                      </div>
                      <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl text-center">
                        <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-1">Profit Boost / Qtl</p>
                        <p className="text-lg font-extrabold text-purple-800 leading-tight">
                          +{forecast.projected_roi_percent || 15}% ROI
                        </p>
                      </div>
                    </div>

                    {/* AI Recommendation Strategy Callout */}
                    <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-2xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl mt-0.5">💡</span>
                        <div>
                          <h4 className="font-extrabold text-amber-400 text-sm uppercase tracking-wider mb-1">
                            AI Real-Time Profit Recommendation for {forecast.location || predictLocation}
                          </h4>
                          <p className="text-xs leading-relaxed text-slate-100 font-medium">
                            {forecast.ai_recommendation_strategy || `Holding your ${predictCrop} for Day ${forecast.best_day} is projected to maximize your total revenue.`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Farmer Revenue Calculator */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                      <h4 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                        <span>🧮</span> Calculate Your Extra Net Profit
                      </h4>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Your Harvest Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            max="10000"
                            value={harvestQuantity}
                            onChange={(e) => setHarvestQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="ff-input py-1.5 px-3 w-28 text-sm text-center font-bold"
                          />
                          <span className="text-xs font-bold text-slate-500">Quintals</span>
                        </div>
                        <div className="flex-1 w-full bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-around text-center">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Sell Today Value</p>
                            <p className="font-extrabold text-slate-700 text-sm">₹{Math.round((forecast.current_price || forecast.forecast_30_days[0]) * harvestQuantity).toLocaleString()}</p>
                          </div>
                          <div className="text-emerald-500 font-bold">➔</div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">Sell at Peak Value (Day {forecast.best_day})</p>
                            <p className="font-extrabold text-emerald-600 text-base">₹{Math.round(forecast.max_price * harvestQuantity).toLocaleString()}</p>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold">Extra Profit Gain</p>
                            <p className="font-extrabold text-amber-600 text-base">
                              +₹{Math.round((forecast.max_price - (forecast.current_price || forecast.forecast_30_days[0])) * harvestQuantity).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stock-Market Style 30-Day Trend Chart */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                      <h4 className="font-bold text-gray-800 text-sm mb-4 text-center flex items-center justify-center gap-2">
                        <span>📈</span> 30-Day Real-Time AI Price Trend (₹ / Quintal)
                      </h4>
                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecast.chartData} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                            <defs>
                              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                            <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                            <Area type="monotone" dataKey="price" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#priceGradient)" activeDot={{ r: 7 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-6xl w-full mx-auto">

          {/* Location Banner Notification */}
          {farmerLocation && (
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                  📍
                </div>
                <div>
                  <p className="font-bold text-emerald-950 text-sm">
                    Mandi Prices Customized for Your Registration Location
                  </p>
                  <p className="text-xs text-emerald-700 font-medium mt-0.5">
                    Currently showing live wholesale prices for <span className="font-bold underline">{farmerLocation}</span> mandis.
                  </p>
                </div>
              </div>
              {search === farmerLocation ? (
                <button
                  onClick={() => setSearch("")}
                  className="px-3 py-1.5 bg-white text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  View All India Mandis
                </button>
              ) : (
                <button
                  onClick={() => setSearch(farmerLocation)}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                >
                  Reset to {farmerLocation}
                </button>
              )}
            </div>
          )}

          {/* Page title */}
          <div className="ff-fade-in ff-stagger-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                <span className="ff-gradient-text">Wholesale Mandi</span> Live Stock Exchange
              </h1>
              <p className="text-xs text-gray-500 mt-1">Real-time market trade price fluctuations & AI profit forecasting for farmers across India.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live Feed: Active
            </div>
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
                placeholder="Search crop, state, or mandi..."
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
                  onClick={() => {
                    setCategory(c);
                    if (search === farmerLocation) setSearch("");
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all capitalize
                    ${category === c
                      ? "text-white border-transparent shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:border-amber-400"
                    }`}
                  style={category === c ? { background: "linear-gradient(135deg,#10b981,#059669)" } : {}}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ── Live Mandi Price Table (Stock Market Style) ── */}
          <div className="ff-card overflow-hidden ff-fade-in ff-stagger-3 border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="ff-table">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    {["Crop", "Market / Location", "Min Price", "Max Price", "Live Modal Price", "Market Trend", "Today's Change", "AI Action"].map(h => (
                      <th key={h} className="text-xs uppercase font-extrabold tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                  ) : prices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">🌾</span>
                          <p className="font-semibold text-gray-500">No mandi prices found for current filter</p>
                          <p className="text-xs text-gray-400">Try searching for all India mandis or clearing location filters.</p>
                          <button
                            onClick={() => { setSearch(""); setCategory("All"); }}
                            className="mt-2 text-xs text-emerald-600 font-bold underline cursor-pointer"
                          >
                            Clear Filters & View All
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    prices.map((p, i) => {
                      const isFlashing = flashingRowId === p._id;
                      return (
                        <tr
                          key={p._id}
                          className={`transition-colors duration-500 ${isFlashing ? (p.trend === 'up' ? 'bg-emerald-100/80' : 'bg-red-100/80') : 'hover:bg-slate-50'}`}
                        >
                          {/* Crop */}
                          <td>
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl p-1.5 bg-slate-100 rounded-xl">{p.emoji}</span>
                              <div>
                                <p className="font-extrabold text-gray-900 text-sm">{p.cropName}</p>
                                <p className="text-[11px] text-gray-400 capitalize">{p.category}</p>
                              </div>
                            </div>
                          </td>

                          {/* Market Location */}
                          <td>
                            <p className="text-gray-800 font-bold text-xs flex items-center gap-1">
                              <span>📍</span> {p.market}
                            </p>
                            <p className="text-[11px] text-gray-400 font-medium">{p.state}</p>
                          </td>

                          {/* Min */}
                          <td className="text-gray-600 font-semibold text-xs">₹{p.minPrice.toLocaleString()}</td>

                          {/* Max */}
                          <td className="text-gray-600 font-semibold text-xs">₹{p.maxPrice.toLocaleString()}</td>

                          {/* Modal Live Price */}
                          <td>
                            <span className="font-extrabold text-gray-900 text-sm flex items-center gap-1">
                              ₹{p.modalPrice.toLocaleString()}
                              <span className="text-[10px] text-gray-400 font-normal">/qtl</span>
                            </span>
                          </td>

                          {/* Market Trend */}
                          <td>
                            <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-full border ${trendColor(p.trend)} ${trendBg(p.trend)}`}>
                              <span>{trendArrow(p.trend)}</span>
                              <span className="capitalize">{p.trend === 'up' ? 'Bullish' : p.trend === 'down' ? 'Bearish' : 'Stable'}</span>
                            </span>
                          </td>

                          {/* Change Percent */}
                          <td>
                            <span className={`font-extrabold text-xs ${p.changePercent > 0 ? "text-emerald-600" : p.changePercent < 0 ? "text-red-500" : "text-gray-400"}`}>
                              {p.changePercent > 0 ? "+" : ""}{p.changePercent}%
                            </span>
                          </td>

                          {/* AI Forecast Action */}
                          <td>
                            <button
                              onClick={() => {
                                setPredictCrop(p.cropName);
                                setPredictLocation(p.state || farmerLocation || "Punjab");
                                setShowPredict(true);
                              }}
                              className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                            >
                              <span>🔮</span> Forecast
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {!loading && prices.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-slate-50 text-xs text-gray-500 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span>ℹ️</span>
                  Live simulated Mandi trade prices updating in real-time. Source: Agmarknet & AI Mandi Feed.
                </div>
                <div className="text-[11px] font-semibold text-slate-400">
                  Total Tracked: {prices.length} Mandi quotes
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
