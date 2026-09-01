import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, UploadCloud, FileText, Droplets, Leaf, Activity } from "lucide-react";
import SharedSidebar from "../components/SharedSidebar";
import LocationInput from "../components/LocationInput";

const MenuIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);

export default function SoilHealthCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    location: "", nitrogen: "", phosphorus: "",
    potassium: "", phLevel: "", organicCarbon: ""
  });

  const fetchTests = async () => {
    try {
      const { data } = await api.get("/soil-health");
      if (data.success) setTests(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/soil-health", {
        ...formData,
        nitrogen: Number(formData.nitrogen),
        phosphorus: Number(formData.phosphorus),
        potassium: Number(formData.potassium),
        phLevel: Number(formData.phLevel),
        organicCarbon: Number(formData.organicCarbon || 0)
      });
      if (data.success) {
        toast.success("Soil test uploaded & analyzed successfully!");
        setFormData({ location: "", nitrogen: "", phosphorus: "", potassium: "", phLevel: "", organicCarbon: "" });
        fetchTests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  const getHealthScore = (score) => {
    if (score >= 85) return { color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", label: "Excellent", border: "1px solid rgba(16, 185, 129, 0.3)" };
    if (score >= 60) return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", label: "Moderate", border: "1px solid rgba(245, 158, 11, 0.3)" };
    return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", label: "Poor", border: "1px solid rgba(239, 68, 68, 0.3)" };
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#F4F6F4" }}>
      <SharedSidebar activePath="/farmer/soil-health" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="ff-topbar flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 cursor-pointer mr-1"><MenuIcon /></button>
          <Link to="/farmer/dashboard"
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="w-px h-4 bg-gray-800" />
          <span className="text-lg">🌱</span>
          <span className="font-extrabold uppercase font-mono tracking-wider text-white text-sm sm:text-base">Soil Health Card</span>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
          {/* Page heading */}
          <div className="ff-fade-in">
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-mono text-white ff-title-glow">Soil Health Digital Card</h1>
            <p className="text-xs text-gray-500 mt-1 font-mono uppercase tracking-wider">Upload test data to auto-generate bio-diagnostic health reports.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

            {/* ── Add Form ── */}
            <div className="ff-card p-6 h-fit ff-fade-in">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-[0_0_12px_rgba(0,245,255,0.35)]"
                  style={{ background: "linear-gradient(135deg,#10b981,#00f5ff)" }}>
                  <UploadCloud size={18} color="#000" />
                </div>
                <h2 className="font-extrabold uppercase font-mono tracking-wide text-white">Upload Test Data</h2>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Sample Location / Plot Name</label>
                  <LocationInput
                    value={formData.location}
                    onChange={(val) => setFormData({...formData, location: val})}
                    placeholder="North Field A"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { name: "nitrogen",   label: "Nitrogen (N)" },
                    { name: "phosphorus", label: "Phosphorus (P)" },
                    { name: "potassium",  label: "Potassium (K)" },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">{f.label}</label>
                      <input required type="number" name={f.name} value={formData[f.name]} onChange={handleChange}
                        placeholder="kg/ha" className="ff-input text-xs" style={{ borderRadius: "0.75rem", padding: "0.5rem 0.75rem" }} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">pH Level</label>
                    <input required type="number" step="0.1" name="phLevel" value={formData.phLevel} onChange={handleChange}
                      placeholder="6.5" className="ff-input text-xs" style={{ borderRadius: "0.75rem" }} />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Organic Carbon (%)</label>
                    <input type="number" step="0.1" name="organicCarbon" value={formData.organicCarbon} onChange={handleChange}
                      placeholder="0.5" className="ff-input text-xs" style={{ borderRadius: "0.75rem" }} />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="ff-btn ff-btn-primary w-full mt-1 uppercase font-bold text-xs tracking-wider"
                  style={{ background: "linear-gradient(135deg,#10b981,#00f5ff)", color: "#000", boxShadow: "0 4px 12px rgba(16,185,129,0.3)" }}>
                  {submitting
                    ? <><svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Analyzing...</>
                    : <><UploadCloud size={16} /> Generate Health Card</>}
                </button>
              </form>
            </div>

            {/* ── Digital Cards ── */}
            <div className="flex flex-col gap-5 lg:col-span-2">
              {loading ? (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="ff-card overflow-hidden">
                    <div className="ff-shimmer h-16 w-full" />
                    <div className="p-6 flex flex-col gap-3">
                      <div className="ff-shimmer h-6 w-1/3 rounded" />
                      <div className="grid grid-cols-4 gap-3 mt-2">
                        {[...Array(4)].map((_, j) => <div key={j} className="ff-shimmer h-20 rounded-xl" />)}
                      </div>
                    </div>
                  </div>
                ))
              ) : tests.length === 0 ? (
                <div className="ff-card flex flex-col items-center justify-center p-12 text-center text-gray-500"
                  style={{ border: "2px dashed rgba(16, 185, 129, 0.2)", minHeight: "250px" }}>
                  <FileText size={48} className="mb-4 opacity-40" />
                  <p className="font-extrabold uppercase font-mono tracking-wide text-white">No soil tests recorded yet</p>
                  <p className="text-xs mt-1 font-mono">Upload data to generate your first digital diagnostic health card.</p>
                </div>
              ) : (
                tests.map((test, idx) => {
                  const hs = getHealthScore(test.healthScore);
                  return (
                    <div key={test._id} className={`ff-card overflow-hidden ff-fade-in ff-stagger-${Math.min(idx + 1, 4)}`}>
                      {/* Government-style header */}
                      <div className="px-5 py-4 flex items-center justify-between"
                        style={{ background: "linear-gradient(135deg,#0a0f24,#0c1328)", borderBottom: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        <div className="flex items-center gap-3">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/250px-Emblem_of_India.svg.png"
                            alt="Emblem" className="h-10 opacity-90" style={{ filter: "brightness(0) invert(1)" }} />
                          <div>
                            <h3 className="font-extrabold text-white tracking-widest text-xs uppercase font-mono ff-title-glow">Soil Health Card</h3>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">Auto-Generated Diagnostic Report</p>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <p className="font-bold text-white text-xs uppercase tracking-wider">{test.location}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{new Date(test.sampleDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col gap-5">
                        {/* Score + NPK grid */}
                        <div className="flex flex-wrap gap-4 items-center">
                          {/* Health Score Gauge */}
                          <div className="flex flex-col items-center justify-center p-4 rounded-2xl min-w-[110px] shadow-[0_0_15px_rgba(16,185,129,0.15)] font-mono"
                            style={{ background: hs.bg, border: hs.border }}>
                            <span className="text-4xl font-black tracking-tighter" style={{ color: hs.color }}>{test.healthScore}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider mt-1" style={{ color: hs.color }}>{hs.label}</span>
                            <span className="text-[9px] text-gray-500 mt-0.5 font-sans font-semibold">HEALTH INDEX</span>
                          </div>

                          {/* NPK + pH */}
                          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0 font-mono">
                            {[
                              { label: "Nitrogen (N)",   value: `${test.nitrogen} kg/ha`,    bg: "rgba(59, 130, 246, 0.08)", border: "rgba(59, 130, 246, 0.25)", color: "#60a5fa" },
                              { label: "Phosphorus (P)", value: `${test.phosphorus} kg/ha`,  bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)", color: "#fb923c" },
                              { label: "Potassium (K)",  value: `${test.potassium} kg/ha`,   bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)", color: "#f87171" },
                              { label: "pH Level",       value: test.phLevel,                bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.25)", color: "#34d399" },
                            ].map(n => (
                              <div key={n.label} className="p-3 rounded-xl flex flex-col items-center gap-1 text-center"
                                style={{ background: n.bg, border: `1px solid ${n.border}` }}>
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: n.color }}>{n.label}</span>
                                <span className="font-extrabold text-white text-sm mt-0.5">{n.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Deficiencies + Recommendations */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl" style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderLeft: "4px solid #ef4444" }}>
                            <h4 className="flex items-center gap-2 text-xs font-bold text-red-400 mb-3 uppercase tracking-wider font-mono">
                              <Activity size={14} /> Key Deficiencies
                            </h4>
                            {test.deficiencies?.length > 0 ? (
                              <ul className="text-xs text-red-300 space-y-1">
                                {test.deficiencies.map(d => (
                                  <li key={d} className="flex items-start gap-2">
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                    {d}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                                <span>✓</span> Optimal substrate levels.
                              </p>
                            )}
                          </div>

                          <div className="p-4 rounded-xl" style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderLeft: "4px solid #10b981" }}>
                            <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider font-mono">
                              <Leaf size={14} /> Recommendations
                            </h4>
                            <div className="flex flex-col gap-3 text-xs">
                              {test.recommendations?.fertilizers?.length > 0 && (
                                <div>
                                  <span className="font-bold text-gray-400 block mb-1.5 text-[10px] uppercase tracking-wider font-mono">Fertilizers:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {test.recommendations.fertilizers.map(f => (
                                      <span key={f} className="px-2 py-0.5 bg-black/40 border border-emerald-900/60 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono">{f}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {test.recommendations?.crops?.length > 0 && (
                                <div>
                                  <span className="font-bold text-gray-400 block mb-1.5 text-[10px] uppercase tracking-wider font-mono">Suitable Crops:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {test.recommendations.crops.map(c => (
                                      <span key={c} className="px-2 py-0.5 bg-black/40 border border-cyan-900/60 text-cyan-400 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono">{c}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
