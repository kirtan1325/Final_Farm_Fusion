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

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto text-white">
        {/* Top Bar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer text-[#a8cfb9]">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-lg"
              style={{ background: "linear-gradient(135deg, #10b981, #00f4fe)", color: "#002021" }}>
              🍃
            </div>
            <div>
              <h1 className="font-bold text-white text-base leading-tight">Crop Health AI</h1>
              <p className="text-xs text-[#a8cfb9] hidden sm:block">Upload photos for instant disease diagnosis & regional treatment guide</p>
            </div>
          </div>
          {user && (
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-[#002021] shadow-md"
              style={{ background: "linear-gradient(135deg, #00f4fe, #4ce346)" }}>
              {getInitials(user.name)}
            </div>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-8 py-8 max-w-6xl mx-auto w-full">
          {/* Main Title Banner */}
          <div className="mb-6 ff-fade-in">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Crop Health <span className="ff-gradient-text">AI Scanner</span></h1>
            <p className="text-[#a8cfb9] mt-1 text-sm max-w-3xl">
              Upload photos for instant disease diagnosis, review past scans, and get automated treatment recommendations based on regional data.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Upload Area */}
            <div className="lg:col-span-2 ff-card p-6 flex flex-col items-center ff-fade-in relative overflow-hidden">
              <div className="w-full flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>⚛️</span> AI Health Scanner
                </h2>
                <span className="text-xs text-[#a8cfb9]">Drag and drop a clear photo of a crop leaf</span>
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`w-full aspect-video sm:aspect-21/9 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group border-2 border-dashed`}
                  style={{
                    borderColor: dragOver ? "#00f4fe" : "rgba(0, 244, 254, 0.3)",
                    background: dragOver ? "rgba(0, 244, 254, 0.1)" : "rgba(6, 44, 29, 0.3)",
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-2 transition-transform group-hover:scale-105 duration-200 bg-[#0b1012] border border-[#00f4fe]/30 shadow-md">
                    🖼️
                  </div>
                  <p className="font-bold text-white text-sm">
                    {dragOver ? "Drop crop image here!" : "Click to browse or drag image here"}
                  </p>
                  <p className="text-xs text-[#a8cfb9] mt-0.5">Supports JPG, PNG (Max 5MB)</p>
                </div>

              ) : (
                <div className="w-full relative rounded-xl overflow-hidden border border-gray-200 group ff-fade-in">
                  {loading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs">
                      <div className="ff-spinner mb-3" style={{ width: "2.5rem", height: "2.5rem" }} />
                      <p className="text-[#0E4B33] text-xs font-bold uppercase tracking-wider animate-pulse">Scanning Crop Leaf...</p>
                    </div>
                  )}
                  <img src={previewUrl} alt="Crop Leaf" className="w-full h-56 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="ff-btn ff-btn-secondary text-xs">Change</button>
                    <button onClick={clearSelection} className="ff-btn ff-btn-danger text-xs">Remove</button>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-700 text-xs mt-3 font-semibold text-center w-full bg-red-50 rounded-xl p-3 border border-red-200">
                  ⚠️ {error}
                </div>
              )}

              <div className="w-full flex justify-end mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || loading}
                  className="ff-btn ff-btn-primary px-6"
                  style={{ background: "#0E4B33" }}
                >
                  {loading ? "Analyzing Image..." : "✨ Analyze Image"}
                </button>
              </div>
            </div>

            {/* Health Alerts Side Panel (Matching Screenshot 1) */}
            <div className="ff-card p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                  <span className="text-red-500">⚠️</span> Health Alerts
                </h3>
                <span className="ff-badge ff-badge-red" style={{ fontSize: "0.65rem" }}>
                  2 New
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs">
                  <p className="font-bold text-red-900">Regional Pest Outbreak: Fall Armyworm</p>
                  <p className="text-red-700 mt-1">Detected in neighboring county. Preventative bio-pesticide recommended within 48h.</p>
                  <button className="mt-2 text-xs font-bold text-red-900 underline cursor-pointer hover:text-red-700">View Mitigation Plan</button>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900">High Humidity Warning</p>
                  <p className="text-amber-700 mt-1">Conditions favorable for Blight in Sector 4. Adjust irrigation schedule.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Area */}
          {result && (
            <div className="mt-6 ff-card p-6 ff-fade-in bg-white">
              <div className="flex items-center justify-between mb-3">
                <span className={`ff-badge ${result.disease === "Healthy" ? "ff-badge-green" : "ff-badge-red"}`}>
                  Analysis Complete
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Crop: <strong className="text-gray-900">{result.affected_crop || "Cotton"}</strong>
                </span>
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900 mb-3 flex items-center gap-2">
                {result.disease === "Healthy" ? "✅" : "⚠️"} {result.disease}
              </h2>

              {/* Confidence bar */}
              {result.confidence && (
                <div className="mb-5">
                  <div className="flex justify-between text-xs font-semibold mb-1 text-gray-500">
                    <span>Confidence Metric</span>
                    <span className="text-[#0E4B33] font-bold">{result.confidence}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-gray-200">
                    <div
                      className="h-2 rounded-full transition-all duration-1000 bg-[#0E4B33]"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#0E4B33]">
                    💊 Recommended Treatment
                  </p>
                  <p className="text-sm font-medium text-gray-900">{result.treatment}</p>
                </div>

                <div className="bg-[#E6F9EF] border border-[#95F2BE] rounded-xl p-4">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1 text-[#0E4B33]">
                    🌿 Organic Alternative
                  </p>
                  <p className="text-sm font-medium text-[#0E4B33]">{result.organic_alternatives}</p>
                </div>
              </div>

              <button
                onClick={clearSelection}
                className="ff-btn ff-btn-secondary w-full mt-5 text-xs"
              >
                🔄 Scan Another Image
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
