import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAiMandiIntelligence } from "../api/cropPriceService";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/layout/AppShell";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import Skeleton from "../components/ui/Skeleton";

const QUICK_MANDI_CROPS = [
  { name: "Wheat", emoji: "🌾" },
  { name: "Rice / Paddy", emoji: "🍚" },
  { name: "Cotton", emoji: "🧵" },
  { name: "Tomato", emoji: "🍅" },
  { name: "Onion", emoji: "🧅" },
  { name: "Groundnut", emoji: "🥜" },
  { name: "Dragon Fruit", emoji: "🐉" },
  { name: "Strawberry", emoji: "🍓" },
];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

export default function CropPrices() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Gemini AI Mandi Intelligence State
  const [aiCropName, setAiCropName] = useState("Wheat");
  const [aiLocation, setAiLocation] = useState(user?.location || "Gujarat");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIntelligence, setAiIntelligence] = useState(null);

  const handleFetchAiIntelligence = async (targetCrop, targetLoc) => {
    const cropQuery = targetCrop || aiCropName;
    const locQuery = targetLoc || aiLocation;
    if (!cropQuery || !cropQuery.trim()) return;

    setAiLoading(true);
    try {
      const res = await getAiMandiIntelligence({
        crop: cropQuery.trim(),
        location: locQuery || user?.location || "Gujarat",
      });
      if (res && res.data) {
        setAiIntelligence(res.data);
      }
    } catch (err) {
      console.error("Gemini Mandi intelligence fetch error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    handleFetchAiIntelligence("Wheat", user?.location || "Gujarat");
  }, []);

  useEffect(() => {
    if (user?.location) {
      setAiLocation(user.location);
    }
  }, [user?.location]);

  return (
    <AppShell
      activePath="/crop-prices"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="✨ Gemini AI Real-Time Mandi Prices"
      subtitle={
        user?.location
          ? `Real-time Mandi commodity rates & AI market intelligence customized for ${user.location}.`
          : "Real-time regional Mandi rates, price trends, and Gemini AI selling strategies."
      }
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Gemini AI Real-Time Mandi Intelligence & Forecast Card */}
        <Card className="border-2 border-emerald-500 shadow-sm">
          <CardHeader className="bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-[#0F4C2A] flex items-center gap-2 text-base sm:text-lg">
                <span>✨</span> Real-Time Gemini AI Mandi Price Engine
              </CardTitle>
              <CardDescription>
                Search any commodity or location for live APMC Mandi price ranges, regional comparisons, and selling advice
              </CardDescription>
            </div>
            <Badge variant="emerald" className="self-start sm:self-auto whitespace-nowrap">
              ✨ Live Gemini AI
            </Badge>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleFetchAiIntelligence();
              }}
              className="flex flex-col sm:flex-row items-end gap-3"
            >
              <Input
                label="Commodity / Crop"
                placeholder="Type crop name (e.g. Wheat, Cotton, Dragon Fruit)..."
                value={aiCropName}
                onChange={(e) => setAiCropName(e.target.value)}
                className="flex-1"
                required
              />
              <Input
                label="Mandi Location / State"
                placeholder="e.g. Navsari, Gujarat"
                value={aiLocation}
                onChange={(e) => setAiLocation(e.target.value)}
                className="flex-1"
                required
              />
              <Button type="submit" loading={aiLoading} className="w-full sm:w-auto shrink-0">
                ✨ Get Live Mandi Rates
              </Button>
            </form>

            {/* Quick Commodity Chips */}
            <div className="pt-1 flex items-center gap-2 flex-wrap text-xs text-slate-600">
              <span className="font-semibold text-slate-500">Quick AI Crops:</span>
              {QUICK_MANDI_CROPS.map((qc) => (
                <button
                  key={qc.name}
                  type="button"
                  onClick={() => {
                    setAiCropName(qc.name);
                    handleFetchAiIntelligence(qc.name, aiLocation);
                  }}
                  className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#0F4C2A] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                >
                  <span>{qc.emoji}</span>
                  <span>{qc.name}</span>
                </button>
              ))}
            </div>

            {/* AI Intelligence Display Banner & Cards */}
            {aiLoading ? (
              <div className="space-y-3 pt-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-32" />
              </div>
            ) : aiIntelligence ? (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                {/* Price Header & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-[#0F4C2A] block">
                      Modal Mandi Rate
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                      {fmt(aiIntelligence.modalPrice)}
                    </p>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {aiIntelligence.priceChangeText || "+2.5% today"}
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Min - Max Price Range
                    </span>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {fmt(aiIntelligence.minPrice)} - {fmt(aiIntelligence.maxPrice)}
                    </p>
                    <span className="text-[11px] text-slate-500">Per Quintal</span>
                  </div>

                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg col-span-1 md:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-amber-900 block flex items-center justify-between">
                      <span>💡 Gemini AI Selling Strategy</span>
                      <Badge variant="emerald">{aiIntelligence.trend === "up" ? "Bullish 📈" : "Stable ➡️"}</Badge>
                    </span>
                    <p className="text-xs text-amber-950 font-medium mt-1 leading-relaxed">
                      {aiIntelligence.sellingAdvice || "Favorable market window to lock in high prices."}
                    </p>
                  </div>
                </div>

                {/* Best Nearby APMC Markets */}
                {aiIntelligence.bestNearbyMarkets && aiIntelligence.bestNearbyMarkets.length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center justify-between">
                      <span>🏛️ Top APMC Mandis Real-Time Comparison ({aiIntelligence.cropName})</span>
                      <span className="text-[11px] text-slate-500 font-normal">Live Rate Comparison</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {aiIntelligence.bestNearbyMarkets.map((mkt, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{mkt.marketName}</span>
                            <span className="text-emerald-700 font-extrabold text-sm">{mkt.modalPrice}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Distance: {mkt.distance}</span>
                            <span className="font-semibold text-emerald-800">{mkt.status}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Drivers */}
                {aiIntelligence.marketDrivers && aiIntelligence.marketDrivers.length > 0 && (
                  <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-1.5">
                    <h4 className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider">
                      📊 Key Market Drivers & Price Factors
                    </h4>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                      {aiIntelligence.marketDrivers.map((driver, i) => (
                        <li key={i}>{driver}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}


