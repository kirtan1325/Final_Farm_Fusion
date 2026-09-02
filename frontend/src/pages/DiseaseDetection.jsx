import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { detectDisease } from "../api/mlService";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";

export default function DiseaseDetection() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
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

  return (
    <AppShell
      activePath="/disease-detection"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Crop Health AI Scanner"
      subtitle="Upload plant leaf photos for computer-vision disease diagnosis & treatment guides."
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Upload Scanner Card */}
          <Card className="lg:col-span-2">
            <CardHeader flex flex-row items-center justify-between>
              <div>
                <CardTitle>AI Disease Scanner</CardTitle>
                <CardDescription>Drag and drop a clear crop leaf photo</CardDescription>
              </div>
              <Badge variant="emerald">Live ML Diagnostics</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragOver ? "border-emerald-600 bg-emerald-50" : "border-slate-300 hover:border-emerald-500 bg-slate-50"
                  }`}
                >
                  <span className="text-4xl block mb-2">📸</span>
                  <p className="text-xs font-bold text-slate-900">
                    {dragOver ? "Drop image here!" : "Click to select or drag leaf photo here"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP (Max 5MB)</p>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 h-64 bg-slate-100">
                  <img src={previewUrl} alt="Crop Leaf Preview" className="w-full h-full object-contain" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Change
                    </Button>
                    <Button variant="danger" size="sm" onClick={clearSelection}>
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
                  ⚠️ {error}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button loading={loading} disabled={!selectedFile} onClick={handleAnalyze} className="px-6">
                  ✨ Analyze Crop Health
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Regional Health Alerts Side Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-1.5">
                <span>⚠️</span> Regional Health Alerts
              </CardTitle>
              <CardDescription>Live agricultural outbreak notices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                <p className="font-bold text-red-900">Pest Warning: Fall Armyworm</p>
                <p className="text-red-700 text-[11px]">Active in neighboring district. Spray bio-pesticides preventative within 48h.</p>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                <p className="font-bold text-amber-900">High Humidity Blight Advisory</p>
                <p className="text-amber-700 text-[11px]">Conditions favor fungus development. Ensure proper field drainage.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diagnosis Results Card */}
        {result && (
          <Card className="border-2 border-emerald-500">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
              <Badge variant={result.disease === "Healthy" ? "success" : "danger"}>
                Analysis Complete
              </Badge>
              <span className="text-xs font-semibold text-slate-700">
                Affected Crop: <strong>{result.affected_crop || "Crop Specimen"}</strong>
              </span>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Diagnosis Finding</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
                  {result.disease === "Healthy" ? "✅ Healthy Crop" : "⚠️ " + result.disease}
                </h2>
              </div>

              {result.confidence && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>AI Confidence</span>
                    <span className="text-[#0F4C2A]">{result.confidence}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#0F4C2A] h-2 rounded-full" style={{ width: `${result.confidence}%` }} />
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">💊 Recommended Treatment</span>
                <p className="text-xs font-medium text-slate-800">{result.treatment}</p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F4C2A]">🌿 Organic Alternative</span>
                <p className="text-xs font-medium text-emerald-900">{result.organic_alternatives}</p>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={clearSelection}>
                  🔄 Scan Another Leaf
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
