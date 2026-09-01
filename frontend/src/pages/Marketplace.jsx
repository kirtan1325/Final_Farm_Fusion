import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMarketplaceCrops } from "../api/cropService";
import { createRequest } from "../api/requestService";
import { useAuth } from "../context/AuthContext";
import SharedSidebar from "../components/SharedSidebar";
import SearchAutocomplete from "../components/SearchAutocomplete";

// ── Icons ──────────────────────────────────────────────
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const CartIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>);
const MenuIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const UserIcon = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const ChevronDown = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>);
const ChevronLeft = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const ChevronRight = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);
const CheckIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);

const SORT_OPTIONS     = ["Newest Arrivals", "Price: Low to High", "Price: High to Low", "Most Popular"];
const CATEGORY_OPTIONS = ["All", "Vegetables", "Fruits", "Grains", "Herbs"];
const PRICE_OPTIONS    = ["Any", "Under $1", "$1–$3", "$3–$5", "Above $5"];
const LOCATION_OPTIONS = ["All Locations", "California", "Idaho", "Arizona", "Texas"];

const BADGE_STYLE = {
  organic:    "ff-badge-green",
  flash_sale: "ff-badge-red",
  new:        "ff-badge-green",
  hot:        "ff-badge-red",
  best_deal:  "ff-badge-gray",
  limited:    "ff-badge-amber",
};

const BG_GRADIENTS = [
  "from-red-900 to-red-700","from-amber-900 to-amber-700","from-emerald-900 to-emerald-700",
  "from-orange-800 to-orange-600","from-purple-900 to-purple-700","from-teal-900 to-teal-700",
  "from-blue-900 to-blue-700","from-lime-900 to-lime-700","from-violet-900 to-violet-700",
  "from-rose-900 to-rose-700","from-cyan-900 to-cyan-700","from-yellow-800 to-yellow-600",
];

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const PER_PAGE = 8;

// ── Filter Dropdown ─────────────────────────────────────
function FilterDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const isActive = value && value !== options[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border transition-all cursor-pointer"
        style={{
          background: isActive ? "rgba(0, 244, 254, 0.18)" : "rgba(6, 44, 29, 0.75)",
          borderColor: isActive ? "#00f4fe" : "rgba(0, 244, 254, 0.25)",
          color: isActive ? "#00f4fe" : "#e0e3e5",
          backdropFilter: "blur(16px)"
        }}
      >
        {label}
        <ChevronDown />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 bg-[#062c1d] border border-[rgba(0,244,254,0.3)] rounded-xl shadow-2xl z-30 py-2 min-w-[180px] ff-scale-in"
          style={{ backdropFilter: "blur(20px)" }}>
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2"
              style={{ color: value === opt ? "#00f4fe" : "#c1c8c2", fontWeight: value === opt ? 700 : 400 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(0, 244, 254, 0.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {value === opt && <CheckIcon />}
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product Card ────────────────────────────────────────
function ProductCard({ crop, user, onViewImage }) {
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const bgIdx = crop._id ? crop._id.charCodeAt(crop._id.length - 1) % BG_GRADIENTS.length : 0;

  const handleSend = async () => {
    if (sent || loading) return;
    setLoading(true);
    try {
      await createRequest({ cropId: crop._id, quantity: 1 });
    } catch {
      // still show feedback even if not authenticated
    } finally {
      setLoading(false);
      setSent(true);
      setTimeout(() => setSent(false), 1800);
    }
  };

  return (
    <div className="ff-card p-0 overflow-hidden flex flex-col ff-fade-in group">
      <div
        className={`relative h-48 bg-gradient-to-br ${BG_GRADIENTS[bgIdx]} flex items-center justify-center overflow-hidden ${
          crop.imageUrl ? "cursor-pointer" : ""
        }`}
        onClick={() => crop.imageUrl && onViewImage && onViewImage(crop)}
      >
        {crop.imageUrl ? (
          <img
            src={crop.imageUrl}
            alt={crop.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="text-7xl select-none drop-shadow-lg">{crop.emoji || "🌾"}</span>
        )}

        {crop.badge && (
          <span
            className={`absolute top-3 left-3 z-10 ff-badge ${BADGE_STYLE[crop.badge] || "ff-badge-blue"}`}
            style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            {crop.badge.replace("_", " ")}
          </span>
        )}

        {crop.imageUrl ? (
          <span className="absolute top-3 right-3 z-10 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow">
            📸 Real Photo
          </span>
        ) : null}

        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-white text-base leading-snug">{crop.name}</h3>
          <span className="font-extrabold text-base whitespace-nowrap flex-shrink-0 text-[#00f4fe]">
            ₹{crop.pricePerUnit?.toFixed(2)}<span className="text-[#a8cfb9] font-normal text-xs">/{crop.unit}</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#a8cfb9]">
          <UserIcon />
          <span>{crop.farmer?.farmName || crop.farmer?.name || "Local Organic Farm"}</span>
        </div>
        {crop.quantity && (
          <p className="text-xs text-[#8b928d]">{crop.quantity} {crop.unit} available in stock</p>
        )}
        {user?.role !== "farmer" && (
          <button
            onClick={handleSend}
            disabled={loading}
            className={`mt-auto w-full ff-btn py-2.5 text-xs font-bold ${sent ? "ff-btn-secondary" : "ff-btn-primary"}`}
          >
            {loading
              ? <span className="ff-spinner" style={{ width: "1rem", height: "1rem" }} />
              : sent ? <><CheckIcon /> Request Sent</> : <><CartIcon /> Request Crop</>}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Image Lightbox Modal ──────────────────────────────────
function ImageModal({ crop, onClose }) {
  if (!crop || !crop.imageUrl) return null;
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 ff-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                📸 Real Crop Harvest Image
              </span>
              <span className="text-xs text-gray-400">{crop.category}</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{crop.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 bg-black/60 flex items-center justify-center max-h-[70vh]">
          <img
            src={crop.imageUrl}
            alt={crop.name}
            className="max-w-full max-h-[65vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>

        <div className="px-6 py-4 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-xs text-gray-300">
          <div>
            <span className="text-gray-400">Farmer / Farm:</span>{" "}
            <span className="font-semibold text-white">
              {crop.farmer?.farmName || crop.farmer?.name || "Local Farmer"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Price:</span>{" "}
            <span className="font-bold text-emerald-400 text-sm">
              ${crop.pricePerUnit?.toFixed(2)} / {crop.unit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="ff-card overflow-hidden">
      <div className="ff-shimmer h-44 w-full" />
      <div className="p-4 flex flex-col gap-3">
        <div className="ff-shimmer h-4 w-3/4 rounded" />
        <div className="ff-shimmer h-3 w-1/2 rounded" />
        <div className="ff-shimmer h-9 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ── Pagination ──────────────────────────────────────────
function Pagination({ current, total, onChange }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1}
        className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
        <ChevronLeft />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className="w-9 h-9 rounded-full text-sm font-semibold transition-all cursor-pointer"
          style={current === p
            ? { background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", boxShadow: "0 2px 8px rgba(16,185,129,0.35)" }
            : { border: "1px solid #e5e7eb", color: "#6b7280" }}>
          {p}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total}
        className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
        <ChevronRight />
      </button>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────
export default function Marketplace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen]             = useState(false);
  const [search, setSearch]                       = useState("");
  const [category, setCategory]                   = useState("All");
  const [priceRange, setPriceRange]               = useState("Any");
  const [location, setLocation]                   = useState("All Locations");
  const [sortBy, setSortBy]                       = useState("Newest Arrivals");
  const [page, setPage]                           = useState(1);
  const [selectedCropImage, setSelectedCropImage] = useState(null);

  const [allCrops, setAllCrops]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [error,    setError]        = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = { status: "available" };
      if (category !== "All") filters.category = category.toLowerCase();
      if (location !== "All Locations") filters.location = location;
      if (priceRange === "Under $1")  { filters.maxPrice = 1; }
      if (priceRange === "$1–$3")     { filters.minPrice = 1;   filters.maxPrice = 3; }
      if (priceRange === "$3–$5")     { filters.minPrice = 3;   filters.maxPrice = 5; }
      if (priceRange === "Above $5")  { filters.minPrice = 5; }
      if (search.trim()) filters.search = search.trim();

      const data = await getMarketplaceCrops(filters);
      let crops = data.data || [];

      if (sortBy === "Price: Low to High") crops = [...crops].sort((a, b) => a.pricePerUnit - b.pricePerUnit);
      if (sortBy === "Price: High to Low") crops = [...crops].sort((a, b) => b.pricePerUnit - a.pricePerUnit);

      setAllCrops(crops);
      setTotalPages(Math.max(1, Math.ceil(crops.length / PER_PAGE)));
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [category, priceRange, location, sortBy, search]);

  useEffect(() => { fetchCrops(); }, [fetchCrops]);

  const handleLogout = () => { logout(); navigate("/login"); };
  const pagedCrops = allCrops.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc", fontFamily: "var(--ff-font)" }}>
      {selectedCropImage && (
        <ImageModal crop={selectedCropImage} onClose={() => setSelectedCropImage(null)} />
      )}

      <SharedSidebar activePath="/marketplace" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* ── Topbar ── */}
        <header className="ff-topbar flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-900 cursor-pointer mr-1">
            <MenuIcon />
          </button>
          <div className="flex-1 max-w-2xl z-40">
            <SearchAutocomplete
              value={search}
              onChange={setSearch}
              fetchSuggestions={async (q) => {
                return allCrops.filter(c => c.name.toLowerCase().includes(q.toLowerCase()));
              }}
              renderItem={(item) => item.name}
              placeholder="Search for fresh crops, farmers, or varieties..."
            />
          </div>
          <span className="hidden sm:block text-sm text-gray-400 ml-2">
            {allCrops.length} product{allCrops.length !== 1 ? "s" : ""}
          </span>
        </header>

        {/* ── Page body ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          {/* Heading */}
          <div className="ff-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Marketplace</h1>
            <p className="text-gray-500 text-sm mt-1">Discover fresh, high-quality harvests directly from local farms.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border-l-4 border-red-500 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
              <button onClick={fetchCrops} className="ml-auto text-xs font-semibold underline cursor-pointer">Retry</button>
            </div>
          )}

          {/* ── Filters ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 ff-fade-in">
            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                label={category === "All" ? "Category" : category}
                options={CATEGORY_OPTIONS} value={category}
                onChange={v => setCategory(v)}
              />
              <FilterDropdown
                label={priceRange === "Any" ? "Price Range" : priceRange}
                options={PRICE_OPTIONS} value={priceRange}
                onChange={v => setPriceRange(v)}
              />
              <FilterDropdown
                label={location === "All Locations" ? "Location" : location}
                options={LOCATION_OPTIONS} value={location}
                onChange={v => setLocation(v)}
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="font-medium whitespace-nowrap">Sort by:</span>
              <FilterDropdown label={sortBy} options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} />
            </div>
          </div>

          {/* ── Product Grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : pagedCrops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {pagedCrops.map((crop, i) => (
                <div key={crop._id} className={`ff-stagger-${Math.min(i % 4 + 1, 4)}`}>
                  <ProductCard crop={crop} user={user} onViewImage={(c) => setSelectedCropImage(c)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 ff-card">
              <span className="text-6xl mb-4 ff-float">🌾</span>
              <p className="text-base font-semibold text-gray-600">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search term</p>
            </div>
          )}

          {!loading && <Pagination current={page} total={totalPages} onChange={setPage} />}
        </main>
      </div>
    </div>
  );
}