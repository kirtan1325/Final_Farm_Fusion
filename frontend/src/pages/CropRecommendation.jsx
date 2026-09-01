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
      const currentLang = localStorage.getItem('farm_fusion_lang') || 'en';
      const data = await predictCrop({
        soil_type: form.soil_type,
        season: form.season,
        location: form.location || user?.location || "Unknown",
        language: currentLang
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
    <div className="flex h-screen overflow-hidden" style={{ background: "#101415" }}>
      <SharedSidebar activePath="/crop-recommendation" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Top Bar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,244,254,0.3)]"
              style={{ background: "linear-gradient(135deg, #00f4fe, #4ce346)", color: "#002021" }}>
              🤖
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">AI Crop Recommendation</h1>
              <p className="text-xs text-[#a8cfb9] hidden sm:block">ML-powered yield & crop optimization engine</p>
            </div>
          </div>
          {user && (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-[0_0_10px_rgba(0,244,254,0.3)]"
              style={{ background: "linear-gradient(135deg, #00f4fe, #4ce346)", color: "#002021" }}>
              {getInitials(user.name)}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 py-8 max-w-4xl mx-auto w-full">
          {/* Page heading */}
          <div className="mb-8 ff-fade-in">
            <h1 className="text-3xl font-extrabold text-white">
              What should you <span className="ff-gradient-text">plant next?</span>
            </h1>
            <p className="text-[#a8cfb9] mt-2 text-sm">
              Use our AI model to predict the most profitable and high-yield crop for your field conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-start">
            {/* Input Form */}
            <div className="ff-card p-6 relative overflow-hidden ff-fade-in">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shadow-[0_0_10px_rgba(0,244,254,0.3)]"
                    style={{ background: "linear-gradient(135deg, #00f4fe, #4ce346)", color: "#002021" }}>
                    🌿
                  </div>
                  <h2 className="font-bold text-white text-base">Enter Field Conditions</h2>
                </div>

                <form onSubmit={handlePredict} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#a8cfb9] uppercase tracking-wider mb-1.5 block">
                      Soil Type
                    </label>
                    <select
                      value={form.soil_type}
                      onChange={e => setForm({ ...form, soil_type: e.target.value })}
                      className="ff-input cursor-pointer bg-[#062c1d]"
                    >
                      {["Loamy", "Clay", "Sandy", "Peaty", "Saline", "Silty"].map(s => (
                        <option key={s} value={s} className="bg-[#062c1d] text-white">{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#a8cfb9] uppercase tracking-wider mb-1.5 block">
                      Season
                    </label>
                    <select
                      value={form.season}
                      onChange={e => setForm({ ...form, season: e.target.value })}
                      className="ff-input cursor-pointer bg-[#062c1d]"
                    >
                      {["Kharif", "Rabi", "Zaid", "Year-round"].map(s => (
                        <option key={s} value={s} className="bg-[#062c1d] text-white">{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#a8cfb9] uppercase tracking-wider mb-1.5 block">
                      Location (State / District)
                    </label>
                    <LocationInput
                      value={form.location}
                      onChange={(val) => setForm({ ...form, location: val })}
                      placeholder={user?.location || "e.g. Anand, Gujarat"}
                    />
                  </div>

                  {error && (
                    <div className="text-xs font-semibold text-red-400 bg-red-950/30 p-3 rounded-xl border border-red-800/40 flex items-center gap-2">
                      <span>⚠️</span> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="ff-btn ff-btn-primary mt-3"
                  >
                    {loading ? (
                      <>
                        <span className="ff-spinner" style={{ width: "1rem", height: "1rem" }} />
                        Analyzing Soil & Weather Data...
                      </>
                    ) : (
                      <>🔮 Generate AI Prediction</>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Results Area */}
            <div className="flex flex-col gap-4">
              {/* Empty placeholder */}
              {!result && !loading && (
                <div className="ff-card p-10 flex flex-col items-center justify-center text-center min-h-[340px] ff-fade-in"
                  style={{ border: "2px dashed rgba(0, 244, 254, 0.2)" }}>
                  <div className="text-6xl mb-4 opacity-60">🌾</div>
                  <p className="text-sm font-bold text-[#00f4fe] uppercase tracking-wider">Field Parameters Ready</p>
                  <p className="text-xs text-[#a8cfb9] mt-2 max-w-xs">Select your soil type and season to calculate the optimal crop yield</p>
                </div>
              )}

              {/* Prediction Result Card */}
              {result && (
                <div className="ff-card p-6 ff-fade-in relative overflow-hidden"
                  style={{ border: "1.5px solid rgba(0, 244, 254, 0.4)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="ff-badge ff-badge-blue">
                      <span className="w-2 h-2 rounded-full bg-[#00f4fe] animate-pulse" />
                      AI Recommendation Ready
                    </span>
                    <span className="text-xs font-semibold text-[#a8cfb9]">
                      Confidence: <strong className="text-[#00f4fe]">{result.confidence || 97.4}%</strong>
                    </span>
                  </div>

                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#a8cfb9] mb-1">Recommended Crop</p>
                    <h2 className="text-3xl font-extrabold text-white flex items-center gap-2">
                      ✨ {result.recommended_crop}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-[#0b0f10]/80 border border-white/10 rounded-xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#00f4fe]">
                        🧪 Fertilizer Recommendation
                      </p>
                      <p className="text-sm font-medium text-white">{result.fertilizer}</p>
                    </div>

                    <div className="bg-[#0b0f10]/80 border border-white/10 rounded-xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#4ce346]">
                        💧 Irrigation Schedule
                      </p>
                      <p className="text-sm font-medium text-[#4ce346]">{result.irrigation_schedule}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
