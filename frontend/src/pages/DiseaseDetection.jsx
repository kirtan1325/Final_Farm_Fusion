import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { detectDisease } from "../api/mlService";
import { useAuth } from "../context/AuthContext";
import SharedSidebar from "../components/SharedSidebar";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

export default function DiseaseDetection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl]     = useState("");
  const [loading, setLoading]           = useState(false);
  const [result, setResult]             = useState(null);
  const [error, setError]               = useState("");
  const [dragOver, setDragOver]         = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image file.");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError("");
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select an image first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Image = reader.result;
          const data = await detectDisease({ image: base64Image, fileName: selectedFile.name });
          if (data && data.success) {
            setResult(data);
          } else {
            setError(data?.message || "Analysis failed. Try again.");
          }
        } catch (err) {
          setError("Could not connect to the ML Service. Ensure it's running.");
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Error reading image file.");
        setLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError("Error reading image file.");
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError("");
    } else {
      setError("Please drop a valid image file.");
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#101415" }}>
      <SharedSidebar activePath="/disease-detection" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-white">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-[0_0_10px_rgba(0,244,254,0.3)]"
              style={{ background: "linear-gradient(135deg, #00f4fe, #4ce346)", color: "#002021" }}>
              🍃
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">AI Disease Detection</h1>
              <p className="text-xs text-[#a8cfb9] hidden sm:block">Deep learning plant leaf scanner & treatment guide</p>
            </div>
          </div>
          {user && (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-[0_0_10px_rgba(0,244,254,0.3)]"
              style={{ background: "linear-gradient(135deg, #00f4fe, #4ce346)", color: "#002021" }}>
              {getInitials(user.name)}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
          {/* Page description */}
          <div className="mb-6 ff-fade-in">
            <p className="text-[#a8cfb9] text-sm">
              Upload a photo of a diseased or pest-infested plant leaf to instantly identify the issue and receive organic & chemical remedies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Upload Area */}
            <div className="ff-card p-6 flex flex-col items-center ff-fade-in relative overflow-hidden">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group`}
                  style={{
                    border: dragOver ? "2px dashed #00f4fe" : "2px dashed rgba(0, 244, 254, 0.35)",
                    background: dragOver ? "rgba(0, 244, 254, 0.12)" : "rgba(6, 44, 29, 0.4)",
                    boxShadow: dragOver ? "0 0 20px rgba(0, 244, 254, 0.25)" : "none",
                  }}
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 transition-transform group-hover:scale-110 duration-300 shadow-[0_0_20px_rgba(0,244,254,0.3)]"
                    style={{ background: "rgba(0, 244, 254, 0.15)", border: "1px solid rgba(0, 244, 254, 0.3)" }}>
                    📸
                  </div>
                  <p className="font-bold text-white text-base">
                    {dragOver ? "Drop leaf image here!" : "Drag & Drop or Click to Upload"}
                  </p>
                  <p className="text-xs text-[#a8cfb9] mt-1 font-medium">JPEG, PNG or WebP supported</p>
                  <div className="mt-4 ff-btn ff-btn-secondary text-xs">
                    Browse Files
                  </div>
                </div>
              ) : (
                <div className="w-full relative rounded-xl overflow-hidden shadow-inner group ff-fade-in">
                  {/* Loading overlay */}
                  {loading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#101415]/80 backdrop-blur-md">
                      <div className="ff-spinner mb-3" style={{ width: "3rem", height: "3rem" }} />
                      <p className="text-[#00f4fe] text-xs font-bold tracking-widest uppercase animate-pulse">Scanning Crop Leaf...</p>
                    </div>
                  )}
                  <img src={previewUrl} alt="Crop Leaf" className="w-full h-auto aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="ff-btn ff-btn-secondary text-xs"
                    >
                      Change
                    </button>
                    <button
                      onClick={clearSelection}
                      className="ff-btn ff-btn-danger text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-xs mt-4 font-semibold text-center w-full bg-red-950/30 rounded-xl p-3 border border-red-800/40">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                className="ff-btn ff-btn-primary w-full mt-6"
              >
                {loading ? (
                  <>
                    <span className="ff-spinner" style={{ width: "1rem", height: "1rem" }} />
                    Analyzing Image...
                  </>
                ) : "🔍 Scan & Analyze Crop Health"}
              </button>
            </div>

            {/* Results Area */}
            <div>
              {/* Empty placeholder */}
              {!result && !loading && (
                <div className="ff-card p-10 flex flex-col items-center justify-center text-center min-h-[340px] ff-fade-in"
                  style={{ border: "2px dashed rgba(0, 244, 254, 0.2)" }}>
                  <div className="text-6xl mb-4 opacity-60">🍃</div>
                  <p className="text-sm font-bold text-[#00f4fe] uppercase tracking-wider">Awaiting Leaf Scan</p>
                  <p className="text-xs text-[#a8cfb9] mt-2 max-w-xs">Upload a leaf photo to view real-time disease diagnostic remedies & treatments</p>
                </div>
              )}

              {/* Result card */}
              {result && (
                <div className="ff-card p-6 ff-fade-in relative overflow-hidden"
                  style={{ border: result.disease === "Healthy" ? "1.5px solid rgba(76, 227, 70, 0.4)" : "1.5px solid rgba(239, 68, 68, 0.4)" }}>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`ff-badge ${result.disease === "Healthy" ? "ff-badge-green" : "ff-badge-red"}`}>
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        Analysis Complete
                      </span>
                      <span className="text-xs font-semibold text-[#a8cfb9]">
                        Crop: <strong className="text-white">{result.affected_crop || "Cotton"}</strong>
                      </span>
                    </div>

                    <h2 className="text-2xl font-extrabold text-white mb-3 flex items-center gap-2">
                      {result.disease === "Healthy" ? "✅" : "⚠️"} {result.disease}
                    </h2>

                    {/* Confidence bar */}
                    {result.confidence && (
                      <div className="mb-5">
                        <div className="flex justify-between text-xs font-semibold mb-1 text-[#a8cfb9]">
                          <span>Confidence Metric</span>
                          <span className="text-[#00f4fe] font-bold">{result.confidence}%</span>
                        </div>
                        <div className="w-full bg-[#0b0f10] rounded-full h-2 overflow-hidden border border-white/10">
                          <div
                            className="h-2 rounded-full transition-all duration-1000"
                            style={{
                              width: `${result.confidence}%`,
                              background: result.disease === "Healthy"
                                ? "linear-gradient(90deg, #4ce346, #34d399)"
                                : "linear-gradient(90deg, #f87171, #ef4444)"
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="bg-[#0b0f10]/80 border border-white/10 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#00f4fe]">
                          💊 Recommended Treatment
                        </p>
                        <p className="text-sm font-medium text-white">{result.treatment}</p>
                      </div>

                      <div className="bg-[#0b0f10]/80 border border-white/10 rounded-xl p-4">
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#4ce346]">
                          🌿 Organic Alternative
                        </p>
                        <p className="text-sm font-medium text-[#4ce346]">{result.organic_alternatives}</p>
                      </div>
                    </div>

                    <button
                      onClick={clearSelection}
                      className="ff-btn ff-btn-secondary w-full mt-5 text-xs"
                    >
                      🔄 Scan Another Image
                    </button>
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
