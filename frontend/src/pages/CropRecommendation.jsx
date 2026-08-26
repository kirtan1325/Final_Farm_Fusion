import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { predictCrop } from "../api/mlService";
import { useAuth } from "../context/AuthContext";
import SharedSidebar from "../components/SharedSidebar";
import LocationInput from "../components/LocationInput";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

export default function CropRecommendation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState({ soil_type: "Loamy", season: "Kharif", location: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await predictCrop({
        soil_type: form.soil_type,
        season: form.season,
        location: form.location || user?.location || "Unknown"
      });
      if (data.success) {
        setResult(data);
      } else {
        setError("Prediction failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to connect to AI/ML service. Please ensure the backend and ML services are running.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      <SharedSidebar activePath="/crop-recommendation" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Top Bar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              🤖
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">AI Crop Recommendation</h1>
              <p className="text-xs text-gray-500 hidden sm:block">ML-powered prediction for optimal yield</p>
            </div>
          </div>
          {user && (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {getInitials(user.name)}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 py-8 max-w-4xl mx-auto w-full">
          {/* Page heading */}
          <div className="mb-8 ff-fade-in">
            <h1 className="text-3xl font-extrabold text-gray-900">
              What should you <span className="ff-gradient-text">plant?</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Use our AI model to predict the most profitable crop based on your local conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-start">
            {/* Input Form */}
            <div className="ff-card p-6 relative overflow-hidden ff-fade-in ff-stagger-1">
              {/* Decorative top strip */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: "linear-gradient(90deg, #10b981, #059669)" }} />
              <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-0 opacity-40"
                style={{ background: "radial-gradient(circle, #d1fae5, transparent)" }} />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                    🌿
                  </div>
                  <h2 className="font-bold text-gray-800">Enter Field Conditions</h2>
                </div>

                <form onSubmit={handlePredict} className="flex flex-col gap-5">
                  <div className="ff-input-group">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Soil Type
                    </label>
                    <select
                      value={form.soil_type}
                      onChange={e => setForm({ ...form, soil_type: e.target.value })}
                      className="ff-input cursor-pointer"
                    >
                      {["Loamy", "Clay", "Sandy", "Peaty", "Saline", "Silty"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ff-input-group">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Season
                    </label>
                    <select
                      value={form.season}
                      onChange={e => setForm({ ...form, season: e.target.value })}
                      className="ff-input cursor-pointer"
                    >
                      {["Kharif", "Rabi", "Zaid", "Year-round"].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="ff-input-group">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                      Location (State / District)
                    </label>
                    <LocationInput
                      value={form.location}
                      onChange={(val) => setForm({ ...form, location: val })}
                      placeholder={user?.location || "e.g. Punjab"}
                    />
                  </div>

                  {error && (
                    <div className="text-xs font-semibold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
                      <span>⚠️</span> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="ff-btn ff-btn-primary mt-1 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="ff-spinner" />
                        Analyzing...
                      </>
                    ) : (
                      <>🔮 Generate Prediction</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Results Area */}
            <div className="flex flex-col gap-4">
              {/* Loading shimmer */}
              {loading && !result && (
                <div className="ff-card p-6 flex flex-col gap-4 ff-fade-in">
                  <div className="ff-shimmer h-5 w-2/3 rounded-lg" />
                  <div className="ff-shimmer h-10 w-1/2 rounded-xl" />
                  <div className="ff-shimmer h-20 rounded-xl" />
                  <div className="ff-shimmer h-20 rounded-xl" />
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center animate-pulse mt-2">
                    Analyzing soil data...
                  </p>
                </div>
              )}

              {/* Empty placeholder */}
              {!result && !loading && (
                <div className="ff-card p-10 flex flex-col items-center justify-center text-center min-h-[320px] ff-fade-in ff-stagger-2"
                  style={{ border: "2px dashed #d1fae5" }}>
                  <div className="text-6xl mb-4 opacity-50">🌱</div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Awaiting Input</p>
                  <p className="text-xs text-gray-400 mt-2">Fill the form to see AI crop insights</p>
                </div>
              )}

              {/* Result card */}
              {result && (
                <div className={`ff-fade-in`}>
                  {/* Main crop result */}
                  <div className="rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl mb-4"
                    style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 40%, #047857 100%)" }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mx-20 -my-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                      <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        AI Confidence: {result.confidence}%
                      </p>

                      {/* Confidence bar */}
                      <div className="w-full bg-white/10 rounded-full h-1.5 mb-5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-1000"
                          style={{
                            width: `${result.confidence}%`,
                            background: "linear-gradient(90deg, #34d399, #10b981)"
                          }}
                        />
                      </div>

                      <h2 className="text-4xl font-black mb-6 flex items-center gap-3">
                        <span>🌾</span> {result.recommended_crop}
                      </h2>

                      <div className="space-y-3">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                          <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                            🌿 Recommended Fertilizer
                          </p>
                          <p className="font-semibold text-white">{result.fertilizer}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                          <p className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1">
                            💧 Irrigation Schedule
                          </p>
                          <p className="font-semibold text-white">{result.irrigation_schedule}</p>
                        </div>
                      </div>

                      <p className="text-[10px] text-emerald-400/60 mt-6 text-center">
                        Prediction based on historical yield data & ML metrics
                      </p>
                    </div>
                  </div>

                  {/* Try again button */}
                  <button
                    onClick={() => setResult(null)}
                    className="ff-btn ff-btn-ghost w-full text-sm"
                  >
                    🔄 Try Different Parameters
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
