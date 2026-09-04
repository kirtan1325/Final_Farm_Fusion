import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { suggestAiSchemes } from "../api/schemeService";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import Skeleton from "../components/ui/Skeleton";

const QUICK_PRESETS = [
  {
    label: "⚡ Small Farmer (2 Acres) - Need Solar Pump",
    landSize: "2",
    farmerType: "Small / Marginal Farmer (< 2 Hectares)",
    crops: "Cotton, Wheat, Groundnut",
    irrigation: "Borewell Pump",
    machinery: "Basic Hand Tools",
    goal: "Solar Pump (PM-KUSUM)",
  },
  {
    label: "🚜 3-5 Acre Farmer - Need Tractor & Machinery",
    landSize: "4",
    farmerType: "Medium Farmer (2-5 Hectares)",
    crops: "Rice, Wheat, Sugarcane",
    irrigation: "Canal & Borewell",
    machinery: "Power Tiller",
    goal: "Farm Machinery & Tractor Subsidy (SMAM)",
  },
  {
    label: "💧 Vegetable Grower - Need Drip Irrigation",
    landSize: "1.5",
    farmerType: "Small / Marginal Farmer (< 2 Hectares)",
    crops: "Tomato, Chili, Onion, Vegetables",
    irrigation: "Open Well",
    machinery: "Sprayer Pump",
    goal: "Drip & Micro-Irrigation (PMKSY)",
  },
  {
    label: "💳 Landowner - Direct Cash & Low Interest Loan",
    landSize: "3",
    farmerType: "Small / Marginal Farmer (< 2 Hectares)",
    crops: "Paddy, Mustard",
    irrigation: "Canal Water",
    machinery: "Tractor Rental",
    goal: "Direct Cash (PM-KISAN) & KCC Loan",
  },
];

function SchemeDetailModal({ scheme, onClose }) {
  if (!scheme) return null;

  return (
    <Modal
      isOpen={Boolean(scheme)}
      onClose={onClose}
      title={scheme.title}
      subtitle={`Category: ${scheme.category || "AGRICULTURAL SUBSIDY"} • ${scheme.matchScore || "High Fit"}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 text-xs">
        {/* Match Score & Category Header Badges */}
        <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-100">
          <Badge variant="emerald">✨ {scheme.matchScore || "Best Fit Match"}</Badge>
          <Badge variant="neutral">{scheme.category || "Government Subsidy"}</Badge>
          <Badge variant="emerald">Official Scheme</Badge>
        </div>

        {/* Financial Benefit Box */}
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
          <h4 className="font-bold text-[#0F4C2A] uppercase tracking-wider text-[11px]">💰 Subsidy & Financial Benefit</h4>
          <p className="text-emerald-950 font-medium leading-relaxed">{scheme.subsidyAmount}</p>
        </div>

        {/* Why Best Fit */}
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">🎯 Why Best Fit For Your Resources</h4>
          <p className="text-slate-600 leading-relaxed">{scheme.whyBestFit}</p>
        </div>

        {/* Eligibility Criteria */}
        {scheme.eligibility && (
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">✅ Eligibility Criteria</h4>
            <p className="text-slate-600 leading-relaxed">{scheme.eligibility}</p>
          </div>
        )}

        {/* Required Documents */}
        {scheme.documentsRequired && scheme.documentsRequired.length > 0 && (
          <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">📄 Required Documents</h4>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5">
              {scheme.documentsRequired.map((doc, i) => (
                <li key={i}>{doc}</li>
              ))}
            </ul>
          </div>
        )}

        {/* How to Apply */}
        {scheme.howToApply && (
          <div className="space-y-1 p-3 bg-slate-900 text-white rounded-lg">
            <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">📝 Step-by-Step Application Guide</h4>
            <p className="text-slate-300 leading-relaxed">{scheme.howToApply}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {scheme.officialLink && (
            <a
              href={scheme.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F4C2A] text-white font-bold rounded-lg hover:bg-[#0A341C] transition-all text-xs shadow-xs"
            >
              Apply on Official Portal ↗
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function GovernmentSchemes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Resource Form State
  const [landSize, setLandSize] = useState(user?.landSize || "2");
  const [location, setLocation] = useState(user?.location || "Gujarat");
  const [farmerType, setFarmerType] = useState(user?.farmerType || "Small / Marginal Farmer (< 2 Hectares)");
  const [crops, setCrops] = useState("Wheat, Rice, Cotton, Vegetables");
  const [irrigation, setIrrigation] = useState("Borewell Pump");
  const [machinery, setMachinery] = useState("Basic Hand Tools & Sprayer");
  const [goal, setGoal] = useState("Solar Pump (PM-KUSUM)");

  // Recommendations State
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const fetchAiSchemes = async (customPayload) => {
    setLoading(true);
    try {
      const payload = customPayload || {
        landSize,
        location,
        farmerType,
        crops,
        irrigation,
        machinery,
        goal,
      };

      const res = await suggestAiSchemes(payload);
      if (res && res.data) {
        setAiResult(res.data);
      }
    } catch (err) {
      console.error("AI Scheme Suggestion error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load recommendation
  useEffect(() => {
    fetchAiSchemes();
  }, []);

  const handleApplyPreset = (preset) => {
    setLandSize(preset.landSize);
    setFarmerType(preset.farmerType);
    setCrops(preset.crops);
    setIrrigation(preset.irrigation);
    setMachinery(preset.machinery);
    setGoal(preset.goal);

    fetchAiSchemes({
      landSize: preset.landSize,
      location,
      farmerType: preset.farmerType,
      crops: preset.crops,
      irrigation: preset.irrigation,
      machinery: preset.machinery,
      goal: preset.goal,
    });
  };

  return (
    <AppShell
      activePath="/schemes"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="✨ Gemini AI Government Scheme Advisor"
      subtitle="Input your available land, water, and machinery resources to get instant Google Gemini AI tailored scheme recommendations."
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Resource Profile Form Card */}
        <Card className="border-2 border-emerald-500 shadow-sm">
          <CardHeader className="bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-[#0F4C2A] flex items-center gap-2 text-base sm:text-lg">
                <span>🏛️</span> Resource-Based Gemini AI Scheme Matcher
              </CardTitle>
              <CardDescription>
                Tell us your farming resources to find the exact government subsidies, solar grants, and loans you qualify for
              </CardDescription>
            </div>
            <Badge variant="emerald" className="self-start sm:self-auto whitespace-nowrap">
              ✨ Powered by Gemini AI
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchAiSchemes();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Input
                  label="Land Size (Acres)"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 2.5"
                  value={landSize}
                  onChange={(e) => setLandSize(e.target.value)}
                  required
                />

                <Input
                  label="Location / State"
                  placeholder="e.g. Gujarat, Maharashtra, UP"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />

                <Select
                  label="Farmer Category"
                  value={farmerType}
                  onChange={(e) => setFarmerType(e.target.value)}
                >
                  <option value="Small / Marginal Farmer (< 2 Hectares)">Small / Marginal (&lt; 5 Acres)</option>
                  <option value="Medium Farmer (2-5 Hectares)">Medium Farmer (5-12 Acres)</option>
                  <option value="Large Farmer (> 5 Hectares)">Large Farmer (&gt; 12 Acres)</option>
                  <option value="Tenant Farmer / Sharecropper">Tenant Farmer / Sharecropper</option>
                </Select>

                <Input
                  label="Primary Crops Grown"
                  placeholder="e.g. Wheat, Rice, Cotton, Vegetables"
                  value={crops}
                  onChange={(e) => setCrops(e.target.value)}
                />

                <Select
                  label="Water & Irrigation Resource"
                  value={irrigation}
                  onChange={(e) => setIrrigation(e.target.value)}
                >
                  <option value="Borewell Pump">Borewell Pump</option>
                  <option value="Canal Water Connection">Canal Water Connection</option>
                  <option value="Open Well / Pond">Open Well / Pond</option>
                  <option value="Rainfed / No Irrigation">Rainfed / No Irrigation</option>
                  <option value="Drip Irrigation Installed">Drip Irrigation Installed</option>
                </Select>

                <Select
                  label="Target Scheme Focus / Need"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                >
                  <option value="Solar Pump (PM-KUSUM)">Solar Water Pump (PM-KUSUM)</option>
                  <option value="Farm Machinery & Tractor Subsidy (SMAM)">Machinery & Tractor Subsidy (SMAM)</option>
                  <option value="Drip & Micro-Irrigation (PMKSY)">Drip Irrigation Grant (PMKSY)</option>
                  <option value="Direct Cash (PM-KISAN) & KCC Loan">Direct Income Cash & KCC Credit</option>
                  <option value="Organic Farming Subsidy (PKVY)">Organic Farming Subsidy (PKVY)</option>
                  <option value="Crop Insurance & Disaster Relief (PMFBY)">Crop Insurance (PMFBY)</option>
                </Select>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Quick Presets */}
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
                  <span className="font-semibold text-slate-500 shrink-0">Quick Presets:</span>
                  {QUICK_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-[#0F4C2A] text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <Button type="submit" loading={loading} className="w-full sm:w-auto shrink-0">
                  ✨ Match Schemes via Gemini AI
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Gemini AI Personalized Analysis Banner */}
        {aiResult?.farmerSummary && (
          <div className="p-4 bg-emerald-900 text-white rounded-xl shadow-xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <span>💡 Gemini AI Resource Fit Summary</span>
              {aiResult.aiEngine && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-800 text-emerald-200">
                  {aiResult.aiEngine}
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed font-normal">
              {aiResult.farmerSummary}
            </p>
          </div>
        )}

        {/* Recommended Schemes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Skeleton className="h-60" />
            <Skeleton className="h-60" />
            <Skeleton className="h-60" />
            <Skeleton className="h-60" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(aiResult?.recommendedSchemes || []).map((sch, index) => (
              <Card
                key={sch.id || index}
                className="hover:shadow-md transition-shadow flex flex-col justify-between p-5 space-y-4 border border-slate-200"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{sch.title}</h3>
                    <Badge variant="emerald">{sch.matchScore || "95% Match"}</Badge>
                  </div>

                  {/* Financial Benefit Callout */}
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#0F4C2A] block">
                      Subsidy Benefit:
                    </span>
                    <span className="text-xs font-semibold text-emerald-950">
                      {sch.subsidyAmount}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    <strong className="text-slate-800 font-semibold">Resource Fit: </strong>
                    {sch.whyBestFit}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedScheme(sch)}>
                    Application & Documents →
                  </Button>

                  {sch.officialLink && (
                    <a
                      href={sch.officialLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F4C2A] hover:bg-[#0A341C] text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Official Portal ↗
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SchemeDetailModal scheme={selectedScheme} onClose={() => setSelectedScheme(null)} />
    </AppShell>
  );
}

