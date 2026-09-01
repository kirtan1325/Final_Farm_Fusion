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
    <div className="flex h-screen overflow-hidden" style={{ background: "#f8fafc" }}>
      <SharedSidebar activePath="/disease-detection" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              🍃
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">AI Disease Detection</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Deep learning powered crop health scanner</p>
            </div>
          </div>
          {user && (
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {getInitials(user.name)}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
          {/* Page heading */}
          <div className="mb-8 ff-fade-in">
            <h1 className="text-3xl font-extrabold text-gray-900">
              Crop <span className="ff-gradient-text">Health Scanner</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              Upload a photo of a diseased or pest-infested plant leaf to instantly identify the issue and get organic/chemical remedies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Upload Area */}
            <div className="ff-card p-6 flex flex-col items-center ff-fade-in ff-stagger-1 relative overflow-hidden">
              {/* Decorative top strip */}
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                style={{ background: "linear-gradient(90deg, #10b981, #059669)" }} />

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group ff-fade-in`}
                  style={{
                    border: dragOver ? "2px dashed #10b981" : "2px dashed #6ee7b7",
                    background: dragOver ? "rgba(16,185,129,0.08)" : "rgba(236,253,245,0.5)",
                    boxShadow: dragOver ? "0 0 0 4px rgba(16,185,129,0.15)" : "none",
                  }}
                >
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mb-5 transition-transform group-hover:scale-110 duration-300"
                    style={{ background: "linear-gradient(135deg, #d1fae5, #a7f3d0)" }}>
                    📸
                  </div>
                  <p className="font-bold text-gray-700 text-base">
                    {dragOver ? "Drop image here!" : "Drag & Drop or Click to Upload"}
                  </p>
                  <p className="text-xs text-gray-400 mt-2 font-medium">JPEG, PNG or WebP supported</p>
                  <div className="mt-4 px-4 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                    Browse Files
                  </div>
                </div>
              ) : (
                <div className="w-full relative rounded-2xl overflow-hidden shadow-inner group ff-fade-in">
                  {/* Loading overlay */}
                  {loading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-emerald-300/30 rounded-full animate-ping" />
                        <div className="absolute inset-2 border-4 border-emerald-400 rounded-full animate-spin border-t-transparent" />
                      </div>
                      <p className="text-white text-sm font-bold mt-4 tracking-widest uppercase animate-pulse">Scanning...</p>
                    </div>
                  )}
                  <img src={previewUrl} alt="Crop Leaf" className="w-full h-auto aspect-square object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition-transform cursor-pointer shadow-md"
                    >
                      Change
                    </button>
                    <button
                      onClick={clearSelection}
                      className="ff-btn ff-btn-danger text-xs px-4 py-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm mt-4 font-semibold text-center w-full bg-red-50 rounded-xl p-3 border border-red-100">
                  ⚠️ {error}
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!selectedFile || loading}
                className="ff-btn ff-btn-primary w-full mt-5 flex items-center justify-center gap-2"
                style={{
                  background: (!selectedFile || loading) ? undefined : "linear-gradient(135deg, #10b981, #059669)",
                  boxShadow: (!selectedFile || loading) ? undefined : "0 4px 15px rgba(16,185,129,0.3)",
                }}
              >
                {loading ? (
                  <>
                    <span className="ff-spinner" />
                    Analyzing Image...
                  </>
                ) : "🔍 Analyze Image"}
              </button>
            </div>

            {/* Results Area */}
            <div>
              {/* Loading shimmer skeleton */}
              {loading && !result && (
                <div className="ff-card p-6 flex flex-col gap-4 ff-fade-in">
                  <div className="ff-shimmer h-4 w-1/3 rounded-lg" />
                  <div className="ff-shimmer h-9 w-2/3 rounded-xl" />
                  <div className="ff-shimmer h-3 w-full rounded-lg" />
                  <div className="ff-shimmer h-24 rounded-xl" />
                  <div className="ff-shimmer h-24 rounded-xl" />
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest text-center animate-pulse">
                    Deep learning analysis in progress...
                  </p>
                </div>
              )}

              {/* Empty placeholder */}
              {!result && !loading && (
                <div className="ff-card p-10 flex flex-col items-center justify-center text-center min-h-[320px] ff-fade-in ff-stagger-2"
                  style={{ border: "2px dashed #d1fae5" }}>
                  <div className="text-6xl mb-4 opacity-50">🍃</div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Upload a Leaf Photo</p>
                  <p className="text-xs text-gray-400 mt-2">Results will appear here after analysis</p>
                </div>
              )}

              {/* Result card */}
              {result && (
                <div className="ff-fade-in">
                  {/* Header result */}
                  <div className="rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl mb-4"
                    style={{
                      background: result.disease === "Healthy"
                        ? "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)"
                        : "linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)"
                    }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mx-20 -my-20 pointer-events-none" />

                    <div className="relative z-10">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2 ${result.disease === "Healthy" ? "text-emerald-300" : "text-red-300"}`}>
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
                        Analysis Complete
                      </p>

                      <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
                        {result.disease === "Healthy" ? "✅" : "⚠️"} {result.disease}
                      </h2>

                      {/* Confidence bar */}
                      {result.confidence && (
                        <div className="mb-6">
                          <div className="flex justify-between text-xs font-semibold mb-1.5 opacity-80">
                            <span>Detection Confidence</span>
                            <span>{result.confidence}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-1000"
                              style={{
                                width: `${result.confidence}%`,
                                background: result.disease === "Healthy"
                                  ? "linear-gradient(90deg, #34d399, #10b981)"
                                  : "linear-gradient(90deg, #fca5a5, #ef4444)"
                              }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${result.disease === "Healthy" ? "text-emerald-300" : "text-red-300"}`}>
                            💊 Recommended Treatment
                          </p>
                          <p className="font-semibold text-white">{result.treatment}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${result.disease === "Healthy" ? "text-emerald-300" : "text-red-300"}`}>
                            🌿 Organic Alternative
                          </p>
                          <p className="font-semibold text-green-300">{result.organic_alternatives}</p>
                        </div>
                      </div>

                      <p className="text-[10px] opacity-50 mt-6 text-center">
                        Powered by Deep Convolutional Neural Networks
                      </p>
                    </div>
                  </div>

                  {/* Scan again */}
                  <button
                    onClick={clearSelection}
                    className="ff-btn ff-btn-ghost w-full text-sm"
                  >
                    🔄 Scan Another Image
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
