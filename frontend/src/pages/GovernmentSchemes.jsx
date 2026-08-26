// frontend/src/pages/GovernmentSchemes.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSchemes } from "../api/schemeService";
import { useAuth } from "../context/AuthContext";
import SharedSidebar from "../components/SharedSidebar";

const MenuIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const CATEGORIES  = ["All", "subsidy", "loan", "insurance", "training", "equipment", "other"];
const CATEGORY_UI = {
  subsidy:   { badge: "ff-badge ff-badge-green",  label: "Subsidy",   icon: "💰" },
  loan:      { badge: "ff-badge ff-badge-blue",   label: "Loan",      icon: "🏦" },
  insurance: { badge: "ff-badge",                 label: "Insurance", icon: "🛡️", style: { background: "#ede9fe", color: "#6d28d9" } },
  training:  { badge: "ff-badge ff-badge-amber",  label: "Training",  icon: "📚" },
  equipment: { badge: "ff-badge ff-badge-amber",  label: "Equipment", icon: "🚜" },
  other:     { badge: "ff-badge ff-badge-gray",   label: "Other",     icon: "📋" },
};

const CATEGORY_ACCENTS = {
  subsidy:   "#10b981",
  loan:      "#3b82f6",
  insurance: "#8b5cf6",
  training:  "#f59e0b",
  equipment: "#f59e0b",
  other:     "#6b7280",
};

export default function GovernmentSchemes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schemes,   setSchemes]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [expanded,  setExpanded]  = useState(null);

  const dashPath = user?.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category !== "All") params.category = category;
        if (search.trim())      params.search    = search.trim();
        const data = await getSchemes(params);
        setSchemes(data.data || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    const t = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [category, search]);

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      <SharedSidebar activePath="/schemes" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              🏛️
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Government Schemes</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Subsidies, loans, insurance & more</p>
            </div>
          </div>
          {user && (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {getInitials(user.name)}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 max-w-4xl w-full mx-auto">
          {/* Page Heading */}
          <div className="ff-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Government <span className="ff-gradient-text">Schemes</span> for Farmers
            </h1>
            <p className="text-sm text-gray-500 mt-1">Subsidies, loans, insurance and more — all in one place.</p>
          </div>

          {/* Eligibility Checker Wizard */}
          <div className="ff-card p-5 relative overflow-hidden ff-fade-in ff-stagger-1"
            style={{ borderLeft: "4px solid #10b981" }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none -mr-16 -mt-16"
              style={{ background: "radial-gradient(circle, #10b981, transparent)" }} />
            <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2 relative z-10">
              <span className="text-xl">✨</span> Smart Eligibility Checker
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <input
                type="number"
                placeholder="Land Size (acres)"
                id="landSize"
                className="ff-input flex-1"
              />
              <input
                type="text"
                placeholder="Crop Type (e.g. Wheat)"
                id="cropType"
                className="ff-input flex-1"
              />
              <select id="schemeCategory" className="ff-input flex-1 cursor-pointer">
                <option value="All">Any Category</option>
                {CATEGORIES.slice(1).map(c => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
              <button
                onClick={async () => {
                  const landSize = document.getElementById("landSize").value;
                  const cropType = document.getElementById("cropType").value;
                  const cat = document.getElementById("schemeCategory").value;
                  setLoading(true);
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || "https://farm-fusion-4.onrender.com"}/api/schemes/check-eligibility`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
                      body: JSON.stringify({ landSize, cropType, category: cat })
                    });
                    const data = await res.json();
                    setSchemes(data.data || []);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="ff-btn ff-btn-primary whitespace-nowrap"
              >
                Check Eligibility
              </button>
            </div>
          </div>

          {/* Search + Category filter */}
          <div className="flex flex-col sm:flex-row gap-3 ff-fade-in ff-stagger-2">
            <div className="ff-input-group flex-1">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2.5 flex-1 focus-within:border-emerald-400 transition-all shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search schemes..."
                  className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 cursor-pointer">✕</button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer capitalize transition-all duration-200 ${
                    category === c
                      ? "text-white border-transparent shadow-md"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-600"
                  }`}
                  style={category === c ? {
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    boxShadow: "0 2px 8px rgba(16,185,129,0.3)"
                  } : {}}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col gap-4 ff-fade-in">
              {[1, 2, 3].map(i => (
                <div key={i} className="ff-card p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="ff-shimmer h-5 w-20 rounded-full" />
                    <div className="ff-shimmer h-4 w-28 rounded-lg" />
                  </div>
                  <div className="ff-shimmer h-6 w-3/4 rounded-lg" />
                  <div className="ff-shimmer h-4 w-full rounded-lg" />
                  <div className="ff-shimmer h-4 w-2/3 rounded-lg" />
                </div>
              ))}
            </div>
          ) : schemes.length === 0 ? (
            <div className="text-center py-20 text-gray-400 ff-fade-in">
              <div className="text-6xl mb-4">🏛️</div>
              <p className="font-bold text-gray-500 text-lg">No schemes found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {schemes.map((s, idx) => {
                const ui = CATEGORY_UI[s.category] || CATEGORY_UI.other;
                const accentColor = CATEGORY_ACCENTS[s.category] || "#6b7280";
                const isOpen = expanded === s._id;
                return (
                  <div
                    key={s._id}
                    className={`ff-card ff-card-hover overflow-hidden ff-fade-in ff-stagger-${Math.min(idx + 1, 4)}`}
                    style={{ borderLeft: `4px solid ${accentColor}` }}
                  >
                    <div className="p-5 cursor-pointer" onClick={() => setExpanded(isOpen ? null : s._id)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span
                              className={ui.badge}
                              style={ui.style || {}}
                            >
                              {ui.icon} {ui.label}
                            </span>
                            {s.deadline && (
                              <span className="ff-badge ff-badge-red">
                                ⏰ {new Date(s.deadline).toLocaleDateString("en-IN")}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{s.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{s.description}</p>
                        </div>
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? "rotate-180" : ""}`}
                          style={{ background: isOpen ? accentColor : "#f3f4f6" }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke={isOpen ? "white" : "#9ca3af"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-gray-100 p-5 flex flex-col gap-4 ff-fade-in"
                        style={{ background: "linear-gradient(to bottom, #f9fafb, #ffffff)" }}>
                        {[
                          { label: "📋 Eligibility",  value: s.eligibility },
                          { label: "🎁 Benefits",     value: s.benefits    },
                          { label: "📝 How to Apply", value: s.howToApply  },
                        ].map(row => row.value && (
                          <div key={row.label}>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{row.label}</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{row.value}</p>
                          </div>
                        ))}

                        {s.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {s.tags.map(tag => (
                              <span key={tag} className="ff-badge ff-badge-gray">#{tag}</span>
                            ))}
                          </div>
                        )}

                        {s.officialLink && (
                          <a
                            href={s.officialLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ff-btn ff-btn-primary w-fit flex items-center gap-1.5 text-sm"
                          >
                            🔗 Apply on Official Website
                          </a>
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
