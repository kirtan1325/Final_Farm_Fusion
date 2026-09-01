// frontend/src/pages/CropAdvisory.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdvisory, getCropNames } from "../api/schemeService";
import { useAuth } from "../context/AuthContext";
import SharedSidebar from "../components/SharedSidebar";
import SearchAutocomplete from "../components/SearchAutocomplete";

const MenuIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const SEASONS = ["All", "Kharif", "Rabi", "Zaid", "All Year"];

const SEASON_ACCENT = {
  Kharif:    { color: "#059669", bg: "linear-gradient(135deg, #064e3b, #065f46)", badge: "ff-badge ff-badge-green" },
  Rabi:      { color: "#2563eb", bg: "linear-gradient(135deg, #1e3a5f, #1d4ed8)", badge: "ff-badge ff-badge-blue" },
  Zaid:      { color: "#d97706", bg: "linear-gradient(135deg, #78350f, #b45309)", badge: "ff-badge ff-badge-amber" },
  "All Year":{ color: "#7c3aed", bg: "linear-gradient(135deg, #3b0764, #6d28d9)", badge: "ff-badge" },
};
const DEFAULT_ACCENT = { color: "#10b981", bg: "linear-gradient(135deg, #064e3b, #065f46)", badge: "ff-badge ff-badge-green" };

const WATER_BADGE = {
  High:   "ff-badge ff-badge-blue",
  Medium: "ff-badge ff-badge-green",
  Low:    "ff-badge ff-badge-amber",
};

export default function CropAdvisory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advisories, setAdvisories]   = useState([]);
  const [cropNames,  setCropNames]    = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [search,     setSearch]       = useState("");
  const [season,     setSeason]       = useState("All");
  const [selected,   setSelected]     = useState(null);

  const dashPath = user?.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";

  useEffect(() => {
    getCropNames().then(d => setCropNames(d.data || []));
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search.trim()) params.crop   = search.trim();
        if (season !== "All") params.season = season;
        const data = await getAdvisory(params);
        setAdvisories(data.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    const t = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [search, season]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#101415" }}>
      <SharedSidebar activePath="/advisory" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-[0_0_10px_rgba(0,244,254,0.3)]"
              style={{ background: "linear-gradient(135deg, #00f4fe, #4ce346)", color: "#002021" }}>
              📖
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Crop Advisory</h1>
              <p className="text-xs text-[#a8cfb9] hidden sm:block">Agronomic recommendations & seasonal field guidance</p>
            </div>
          </div>
          {user && (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {getInitials(user.name)}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 max-w-5xl w-full mx-auto">
          {/* Page Heading */}
          <div className="ff-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Crop <span className="ff-gradient-text">Advisory</span> Guide
            </h1>
            <p className="text-sm text-gray-500 mt-1">Expert growing tips, disease info, and best practices for each crop.</p>
          </div>

          {/* Quick crop buttons */}
          {cropNames.length > 0 && (
            <div className="flex flex-wrap gap-2 ff-fade-in ff-stagger-1">
              {cropNames.map(c => (
                <button
                  key={c}
                  onClick={() => setSearch(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-200 ${
                    search === c
                      ? "text-white border-transparent shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                  style={search === c ? {
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: "0 2px 8px rgba(16,185,129,0.3)"
                  } : {}}
                >
                  {c}
                </button>
              ))}
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-gray-100 text-gray-500 cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  Clear ×
                </button>
              )}
            </div>
          )}

          {/* Search + Season Filters */}
          <div className="flex flex-wrap gap-3 ff-fade-in ff-stagger-2">
            <div className="w-64 z-40">
              <SearchAutocomplete
                value={search}
                onChange={(val) => setSearch(val)}
                fetchSuggestions={async (q) => {
                  return cropNames
                    .filter(c => c.toLowerCase().includes(q.toLowerCase()))
                    .map(c => ({ name: c }));
                }}
                placeholder="Search crop..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {SEASONS.map(s => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-200 ${
                    season === s
                      ? "text-white border-transparent shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                  style={season === s ? {
                    background: SEASON_ACCENT[s]?.bg || "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: `0 2px 8px ${SEASON_ACCENT[s]?.color || "#10b981"}40`
                  } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ff-fade-in">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="ff-card p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="ff-shimmer w-14 h-14 rounded-2xl" />
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="ff-shimmer h-5 w-3/4 rounded-lg" />
                      <div className="ff-shimmer h-4 w-1/2 rounded-lg" />
                    </div>
                  </div>
                  <div className="ff-shimmer h-4 w-full rounded-lg" />
                  <div className="ff-shimmer h-4 w-2/3 rounded-lg" />
                </div>
              ))}
            </div>
          ) : advisories.length === 0 ? (
            <div className="text-center py-20 text-gray-400 ff-fade-in">
              <div className="text-6xl mb-4">🌾</div>
              <p className="font-bold text-gray-500 text-lg">No advisories found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or season filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {advisories.map((a, idx) => {
                const accent = SEASON_ACCENT[a.season] || DEFAULT_ACCENT;
                const waterBadge = WATER_BADGE[a.waterNeeds] || "ff-badge ff-badge-gray";
                const isSelected = selected?._id === a._id;

                return (
                  <div
                    key={a._id}
                    className={`ff-card ff-card-hover overflow-hidden cursor-pointer ff-fade-in ff-stagger-${Math.min(idx + 1, 4)} transition-all duration-300`}
                    style={{
                      borderTop: `3px solid ${accent.color}`,
                      boxShadow: isSelected ? `0 0 0 2px ${accent.color}40, 0 8px 25px rgba(0,0,0,0.1)` : undefined,
                    }}
                    onClick={() => setSelected(isSelected ? null : a)}
                  >
                    <div className="p-5">
                      {/* Crop header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 shadow-sm"
                          style={{ background: `${accent.color}15` }}>
                          {a.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base leading-tight truncate">{a.cropName}</h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={accent.badge || "ff-badge ff-badge-green"}
                              style={a.season && !SEASON_ACCENT[a.season] ? {} : undefined}>
                              {a.season}
                            </span>
                            <span className={waterBadge}>💧 {a.waterNeeds}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick stats grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {a.temperature && (
                          <div className="bg-gray-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Temp</p>
                            <p className="text-xs text-gray-700 font-semibold mt-0.5">🌡️ {a.temperature}</p>
                          </div>
                        )}
                        {a.sowingTime && (
                          <div className="bg-gray-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Sow</p>
                            <p className="text-xs text-gray-700 font-semibold mt-0.5">🌱 {a.sowingTime}</p>
                          </div>
                        )}
                        {a.harvestTime && (
                          <div className="bg-gray-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Harvest</p>
                            <p className="text-xs text-gray-700 font-semibold mt-0.5">🌾 {a.harvestTime}</p>
                          </div>
                        )}
                        {a.soilType && (
                          <div className="bg-[#0b0f10]/80 border border-white/10 rounded-xl px-3 py-2 col-span-2 sm:col-span-1">
                            <p className="text-[10px] text-[#a8cfb9] font-bold uppercase tracking-wide">Soil</p>
                            <p className="text-xs text-white font-medium mt-0.5 break-words">🌍 {a.soilType}</p>
                          </div>
                        )}
                      </div>

                      {/* Expand indicator */}
                      <div className="flex items-center justify-center mt-4 gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? "" : "bg-gray-200"}`}
                          style={isSelected ? { background: accent.color } : {}} />
                        <p className="text-xs text-gray-400 font-medium">
                          {isSelected ? "Click to collapse" : "Click for details"}
                        </p>
                        <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? "" : "bg-gray-200"}`}
                          style={isSelected ? { background: accent.color } : {}} />
                      </div>
                    </div>

                    {/* Expanded details panel with ff-glass style */}
                    {isSelected && (
                      <div className="border-t p-5 flex flex-col gap-4 ff-fade-in"
                        style={{
                          borderColor: `${accent.color}30`,
                          background: "linear-gradient(to bottom, #f9fafb, #ffffff)"
                        }}>
                        {/* Fertilizer */}
                        {a.fertilizer && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🧪 Fertilizer</p>
                            <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 rounded-xl p-3 border border-blue-100">{a.fertilizer}</p>
                          </div>
                        )}

                        {/* Common pests */}
                        {a.commonPests && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">🐛 Common Pests</p>
                            <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 rounded-xl p-3 border border-amber-100">{a.commonPests}</p>
                          </div>
                        )}

                        {/* Tips */}
                        {a.tips?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">💡 Expert Tips</p>
                            <ul className="flex flex-col gap-2">
                              {a.tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                                  <span className="font-bold text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Diseases & Remedies */}
                        {a.diseases?.length > 0 && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">🦠 Diseases & Remedies</p>
                            <div className="flex flex-col gap-2">
                              {a.diseases.map((d, i) => (
                                <div key={i} className="bg-red-50 border border-red-100 rounded-xl p-3">
                                  <p className="font-bold text-red-700 text-sm mb-1">{d.name}</p>
                                  <p className="text-xs text-gray-600">
                                    <span className="font-semibold">Symptom:</span> {d.symptom}
                                  </p>
                                  <p className="text-xs text-emerald-700 mt-1">
                                    <span className="font-semibold">Remedy:</span> {d.remedy}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
