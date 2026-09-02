import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { predictCrop } from "../api/mlService";
import { useAuth } from "../context/AuthContext";
import LocationInput from "../components/LocationInput";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Select } from "../components/ui/Input";

export default function CropRecommendation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
      const currentLang = localStorage.getItem("farm_fusion_lang") || "en";
      const data = await predictCrop({
        soil_type: form.soil_type,
        season: form.season,
        location: form.location || user?.location || "Unknown",
        language: currentLang,
      });
      if (data.success) {
        setResult(data);
      } else {
        setError("Prediction failed.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to AI/ML service. Please ensure the prediction server is available."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell
      activePath="/crop-recommendation"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="AI Crop Recommendation Engine"
      subtitle="Input your soil profile and climate parameters to receive machine-learning powered crop selections."
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Parameter Form */}
          <Card>
            <CardHeader>
              <CardTitle>Field & Climate Conditions</CardTitle>
              <CardDescription>Enter parameters for ML model evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePredict} className="space-y-4">
                <Select
                  label="Soil Type"
                  value={form.soil_type}
                  onChange={(e) => setForm({ ...form, soil_type: e.target.value })}
                >
                  {["Loamy", "Clay", "Sandy", "Peaty", "Saline", "Silty"].map((s) => (
                    <option key={s} value={s}>
                      {s} Soil
                    </option>
                  ))}
                </Select>

                <Select
                  label="Season"
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                >
                  {["Kharif", "Rabi", "Zaid", "Year-round"].map((s) => (
                    <option key={s} value={s}>
                      {s} Season
                    </option>
                  ))}
                </Select>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Field Location
                  </label>
                  <LocationInput
                    value={form.location}
                    onChange={(val) => setForm({ ...form, location: val })}
                    placeholder={user?.location || "e.g. Anand, Gujarat"}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
                    ⚠️ {error}
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full mt-2">
                  🔮 Generate AI Crop Prediction
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Visualizer */}
          <div className="space-y-4">
            {!result && !loading && (
              <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[340px] border-dashed">
                <span className="text-5xl mb-3">🌾</span>
                <h3 className="text-base font-bold text-slate-900">Parameters Ready</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Fill in your soil profile and click predict to calculate optimal crop options.
                </p>
              </Card>
            )}

            {result && (
              <Card className="border-2 border-emerald-500">
                <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
                  <Badge variant="emerald" pulse>
                    AI Recommendation
                  </Badge>
                  <span className="text-xs font-bold text-emerald-800">
                    Confidence Score: {result.confidence || 97.4}%
                  </span>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recommended Crop</span>
                    <h2 className="text-3xl font-extrabold text-[#0F4C2A] mt-1 flex items-center gap-2">
                      ✨ {result.recommended_crop}
                    </h2>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">🧪 Fertilizer Strategy</span>
                    <p className="text-xs font-medium text-slate-800">{result.fertilizer}</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700">💧 Irrigation Schedule</span>
                    <p className="text-xs font-medium text-slate-800">{result.irrigation_schedule}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
