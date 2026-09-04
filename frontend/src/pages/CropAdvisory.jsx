import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdvisory, getCropNames, generateAiAdvisory } from "../api/schemeService";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const SEASONS = ["All", "Kharif", "Rabi", "Zaid", "All Year"];
const QUICK_CROPS = [
  { name: "Strawberry", emoji: "🍓" },
  { name: "Dragon Fruit", emoji: "🐉" },
  { name: "Avocado", emoji: "🥑" },
  { name: "Black Rice", emoji: "🌾" },
  { name: "Chili", emoji: "🌶️" },
  { name: "Groundnut", emoji: "🥜" },
  { name: "Sweet Corn", emoji: "🌽" },
  { name: "Tomato", emoji: "🍅" },
];

function AdvisoryModal({ item, onClose }) {
  if (!item) return null;
  const isAi = item.isAiGenerated || item.aiEngine;

  return (
    <Modal
      isOpen={Boolean(item)}
      onClose={onClose}
      title={`${item.emoji || "🌾"} ${item.cropName} Agronomic Guide`}
      subtitle={isAi ? `Powered by ${item.aiEngine || "Google Gemini AI Engine"}` : `Seasonal Cultivation Guide (${item.season || "General"})`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-xs">
        {/* Header badges */}
        <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-100">
          <Badge variant={isAi ? "emerald" : "neutral"}>
            {isAi ? "✨ Google Gemini AI" : "📖 Verified Guide"}
          </Badge>
          <Badge variant="emerald">{item.season || "All Season"}</Badge>
          <Badge variant="neutral">Water Need: {item.waterRequirement || "Medium"}</Badge>
          {item.temperature && <Badge variant="neutral">Temp: {item.temperature}</Badge>}
        </div>

        {/* Soil & Timeline Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div>
            <h4 className="font-bold text-slate-800">Optimal Soil & pH</h4>
            <p className="text-slate-600 mt-0.5">{item.soilType || "Well-drained loamy soil with high organic matter."}</p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800">Sowing & Harvest Schedule</h4>
            <p className="text-slate-600 mt-0.5">
              Sowing: {item.sowingTime || item.sowingPeriod || "Beginning of season"} <br />
              Harvest: {item.harvestTime || "90-120 days"}
            </p>
          </div>
        </div>

        {/* Fertilizer & NPK */}
        <div className="space-y-1 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
          <h4 className="font-bold text-[#0F4C2A]">🧪 Fertilizer & Nutrient Schedule</h4>
          <p className="text-emerald-950 leading-relaxed">
            {item.fertilizer || "Apply FYM 10 t/ha + NPK 120:60:40 kg/ha in split doses."}
          </p>
        </div>

        {/* Pests & Pest Control */}
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">🐛 Common Pests & Control</h4>
          <p className="text-slate-600">
            {item.commonPests || item.pestInfo || "Monitor for aphids, stem borers, and thrips. Use neem oil sprays."}
          </p>
        </div>

        {/* Diseases Table if present */}
        {item.diseases && item.diseases.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900">🦠 Disease Symptoms & Remedies</h4>
            <div className="space-y-2">
              {item.diseases.map((d, i) => (
                <div key={i} className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between font-bold text-amber-900">
                    <span>{d.name}</span>
                  </div>
                  <p className="text-slate-700"><strong>Symptom:</strong> {d.symptom}</p>
                  <p className="text-emerald-800"><strong>Remedy:</strong> {d.remedy}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Practice Guidance */}
        <div className="space-y-1.5 p-3 bg-slate-900 text-white rounded-lg">
          <h4 className="font-bold text-emerald-400">💡 Agronomic High-Yield Best Practices</h4>
          <p className="text-slate-300 leading-relaxed">
            {item.bestPractices || "Practice crop rotation, weed management, and drip irrigation for optimal yield."}
          </p>
          {item.tips && item.tips.length > 0 && (
            <ul className="list-disc list-inside text-slate-300 pt-1 space-y-1">
              {item.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function CropAdvisory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [advisories, setAdvisories] = useState([]);
  const [cropNames, setCropNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState("All");
  const [selectedItem, setSelectedItem] = useState(null);

  // Gemini AI Generator state
  const [aiCropInput, setAiCropInput] = useState("");
  const [aiSeasonInput, setAiSeasonInput] = useState("Kharif");
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    getCropNames().then((d) => setCropNames(d.data || []));
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (search.trim()) params.crop = search.trim();
        if (season !== "All") params.season = season;
        const data = await getAdvisory(params);
        setAdvisories(data.data || []);
      } catch (err) {
        console.error("Advisory fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, season]);

  const handleGenerateAiAdvisory = async (targetCropName) => {
    const cropToFetch = targetCropName || aiCropInput || search;
    if (!cropToFetch || !cropToFetch.trim()) return;

    setAiGenerating(true);
    try {
      const res = await generateAiAdvisory({
        crop: cropToFetch.trim(),
        location: user?.location || "",
        season: aiSeasonInput !== "All" ? aiSeasonInput : undefined,
      });

      if (res && res.data) {
        setSelectedItem(res.data);
      }
    } catch (err) {
      console.error("AI Advisory generation error:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <AppShell
      activePath="/advisory"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Agronomic Crop Advisory & Gemini AI Guide"
      subtitle="Seasonal cultivation guides, pest management strategies, and instant Google Gemini AI crop advisories."
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Gemini AI Advisory Generator Card */}
        <Card className="border-2 border-emerald-500">
          <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between">
            <div>
              <CardTitle className="text-[#0F4C2A] flex items-center gap-2">
                <span>✨</span> Ask Google Gemini AI for Crop Advisory
              </CardTitle>
              <CardDescription>
                Search or enter any crop name (e.g. Dragon Fruit, Strawberry, Sorghum) to generate instant Gemini AI agronomic guides
              </CardDescription>
            </div>
            <Badge variant="emerald">Live Gemini AI</Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateAiAdvisory();
              }}
              className="flex flex-col sm:flex-row items-end gap-3"
            >
              <Input
                label="Crop Name"
                placeholder="Type any crop (e.g. Dragon Fruit, Strawberry, Mustard)..."
                value={aiCropInput}
                onChange={(e) => setAiCropInput(e.target.value)}
                className="flex-1"
                required
              />
              <Select
                label="Season"
                value={aiSeasonInput}
                onChange={(e) => setAiSeasonInput(e.target.value)}
                className="w-36 text-xs"
              >
                <option value="Kharif">Kharif</option>
                <option value="Rabi">Rabi</option>
                <option value="Zaid">Zaid</option>
                <option value="All Year">All Year</option>
              </Select>
              <Button type="submit" loading={aiGenerating} className="w-full sm:w-auto shrink-0">
                ✨ Generate Gemini AI Guide
              </Button>
            </form>

            {/* Quick-select Crop Chips */}
            <div className="pt-2 flex items-center gap-2 flex-wrap text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Popular AI Crops:</span>
              {QUICK_CROPS.map((qc) => (
                <button
                  key={qc.name}
                  type="button"
                  onClick={() => {
                    setAiCropInput(qc.name);
                    handleGenerateAiAdvisory(qc.name);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#0F4C2A] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                >
                  <span>{qc.emoji}</span>
                  <span>{qc.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Input
            placeholder="Search crop advisory (e.g. Wheat, Tomato)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-80"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => setSeason(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  season === s
                    ? "bg-[#0F4C2A] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Advisory Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
            <Skeleton className="h-56" />
          </div>
        ) : advisories.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">📖</span>}
            title={search.trim() ? `No saved guides found for "${search}"` : "No advisory guides found"}
            description={
              search.trim()
                ? `Ask Google Gemini AI to generate an instant agronomic guide for "${search}".`
                : "Try adjusting your crop search query or season filter."
            }
            actionLabel={search.trim() ? `✨ Ask Gemini AI for "${search}" Guide` : "Reset Search"}
            onAction={() => {
              if (search.trim()) {
                setAiCropInput(search.trim());
                handleGenerateAiAdvisory(search.trim());
              } else {
                setSearch("");
                setSeason("All");
              }
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {advisories.map((adv) => (
              <Card key={adv._id} className="hover:shadow-md transition-shadow flex flex-col justify-between p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{adv.cropName}</h3>
                    <Badge variant="emerald">{adv.season || "General"}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {adv.bestPractices || adv.summary || "Agronomic guidance for optimal crop yield."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Water Need: <strong className="text-slate-800">{adv.waterRequirement || "Medium"}</strong>
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setSelectedItem(adv)}>
                    Read Guide →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AdvisoryModal item={selectedItem} onClose={() => setSelectedItem(null)} />
    </AppShell>
  );
}
