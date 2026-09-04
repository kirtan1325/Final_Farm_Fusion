import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCropPrices, getAiMandiIntelligence } from "../api/cropPriceService";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

import AppShell from "../components/layout/AppShell";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const CATEGORIES = ["All", "vegetables", "fruits", "grains", "herbs", "other"];
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
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAllMandis, setShowAllMandis] = useState(false);
  const [appliedLocation, setAppliedLocation] = useState(user?.location || null);

  const [useGeminiMode, setUseGeminiMode] = useState(false);

  // Gemini AI Mandi Intelligence State
  const [aiCropName, setAiCropName] = useState("Wheat");
  const [aiLocation, setAiLocation] = useState(user?.location || "Gujarat");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiIntelligence, setAiIntelligence] = useState(null);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (useGeminiMode) {
        params.useAi = "true";
      }
      if (showAllMandis) {
        params.showAll = "true";
      } else if (user?.location) {
        params.location = user.location;
      }
      const data = await getCropPrices(params);
      setPrices(data.data || []);
      if (data.appliedLocation) setAppliedLocation(data.appliedLocation);
    } catch (err) {
      console.error("Mandi prices error:", err);
    } finally {
      setLoading(false);
    }
  }, [showAllMandis, useGeminiMode, user?.location]);

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
    fetchPrices();
    handleFetchAiIntelligence("Wheat", user?.location || "Gujarat");
  }, [fetchPrices]);

  // Real-time Socket.IO listener for live Mandi rate updates
  useEffect(() => {
    if (!socket) return;
    const handlePriceUpdate = () => {
      fetchPrices();
    };
    socket.on("mandi_price_updated", handlePriceUpdate);
    return () => {
      socket.off("mandi_price_updated", handlePriceUpdate);
    };
  }, [socket, fetchPrices]);

  // Background auto-refresh polling every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      fetchPrices();
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchPrices]);

  useEffect(() => {
    if (user?.location) {
      setAiLocation(user.location);
    }
  }, [user?.location]);


  const filteredPrices = prices.filter((p) => {
    const matchesSearch =
      p.cropName.toLowerCase().includes(search.toLowerCase()) ||
      (p.state && p.state.toLowerCase().includes(search.toLowerCase())) ||
      (p.market && p.market.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = category === "All" || p.category?.toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const gainersCount = filteredPrices.filter((p) => p.trend === "up").length;
  const avgModalPrice = filteredPrices.length
    ? Math.round(filteredPrices.reduce((s, p) => s + (p.modalPrice || 0), 0) / filteredPrices.length)
    : 0;

  return (
    <AppShell
      activePath="/crop-prices"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Live Mandi Commodity Prices & Gemini AI Market Intelligence"
      subtitle={
        user?.location
          ? `Real-time Mandi market rates & Gemini AI price forecasts customized for ${user.location}.`
          : "Real-time regional Mandi rates, historical price trends, and Gemini AI price forecasts."
      }
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Gemini AI Real-Time Mandi Intelligence & Forecast Card */}
        <Card className="border-2 border-emerald-500 shadow-sm">
          <CardHeader className="bg-emerald-50/60 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-[#0F4C2A] flex items-center gap-2 text-base sm:text-lg">
                <span>✨</span> Real-Time Gemini AI Mandi Price Intelligence & Market Forecast
              </CardTitle>
              <CardDescription>
                Query Google Gemini AI for live Mandi price ranges, neighboring APMC market rates, and high-profit selling advice
              </CardDescription>
            </div>
            <Badge variant="emerald" className="self-start sm:self-auto whitespace-nowrap">
              ✨ Live Gemini AI Engine
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
                ✨ Get Gemini AI Mandi Forecast
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
            {aiIntelligence && (
              <div className="space-y-4 pt-3 border-t border-slate-200">
                {/* Price Header & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-[#0F4C2A] block">
                      Modal Mandi Rate
                    </span>
                    <p className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {fmt(aiIntelligence.modalPrice)}
                    </p>
                    <span className="text-[11px] font-medium text-emerald-700">
                      {aiIntelligence.priceChangeText || "+2.5% today"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Min - Max Range
                    </span>
                    <p className="text-sm font-bold text-slate-800 mt-1">
                      {fmt(aiIntelligence.minPrice)} - {fmt(aiIntelligence.maxPrice)}
                    </p>
                    <span className="text-[11px] text-slate-500">Per Quintal</span>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg col-span-1 md:col-span-2">
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
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center justify-between">
                      <span>🏛️ Top Neighboring Mandis Comparison ({aiIntelligence.cropName})</span>
                      <span className="text-[11px] text-slate-500 font-normal">Real-Time Price Comparison</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {aiIntelligence.bestNearbyMarkets.map((mkt, idx) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded-md text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{mkt.marketName}</span>
                            <span className="text-emerald-700">{mkt.modalPrice}</span>
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
              </div>
            )}
          </CardContent>
        </Card>



        {/* Mandi Rate Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Crop Mandi Rates Tracker</CardTitle>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  {useGeminiMode ? "✨ Live Gemini AI Pricing" : "Live Socket.IO Updates"}
                </span>
              </div>
              <CardDescription>Minimum, Maximum, and Modal prices listed in real-time</CardDescription>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant={useGeminiMode ? "primary" : "outline"}
                size="sm"
                onClick={() => setUseGeminiMode(!useGeminiMode)}
                className="text-xs"
              >
                {useGeminiMode ? "✨ Gemini AI Live Rates Active" : "✨ Switch to Gemini AI Live Rates"}
              </Button>

              <Input
                placeholder="Search commodity or Mandi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 text-xs py-1.5"
              />
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-36 text-xs py-1.5"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : filteredPrices.length === 0 ? (
              <EmptyState
                icon={() => <span className="text-3xl">📈</span>}
                title="No Mandi prices found"
                description="Click 'Switch to Gemini AI Live Rates' to fetch real-time crop pricing for any region."
                actionLabel="✨ Fetch Gemini AI Live Rates"
                onAction={() => {
                  setUseGeminiMode(true);
                  fetchPrices();
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                      <th className="px-5 py-3.5">Commodity</th>
                      <th className="px-5 py-3.5">Mandi Market</th>
                      <th className="px-5 py-3.5">State / Region</th>
                      <th className="px-5 py-3.5">Min Rate</th>
                      <th className="px-5 py-3.5">Max Rate</th>
                      <th className="px-5 py-3.5">Modal Rate</th>
                      <th className="px-5 py-3.5">Daily Trend</th>
                      <th className="px-5 py-3.5">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPrices.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                          <span>{item.emoji || "🌾"}</span>
                          {item.cropName}
                        </td>
                        <td className="px-5 py-4 text-slate-700">{item.market || "Regional Yard"}</td>
                        <td className="px-5 py-4 text-slate-500">{item.state || "Gujarat"}</td>
                        <td className="px-5 py-4 text-slate-600 font-medium">{fmt(item.minPrice || 0)}</td>
                        <td className="px-5 py-4 text-slate-600 font-medium">{fmt(item.maxPrice || 0)}</td>
                        <td className="px-5 py-4 font-extrabold text-[#0F4C2A]">
                          {fmt(item.modalPrice || 0)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant={item.trend === "up" ? "success" : "danger"}>
                            {item.trend === "up" ? "▲ Upward" : "▼ Downward"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          {item.isAiGenerated ? (
                            <Badge variant="emerald">✨ Gemini AI</Badge>
                          ) : (
                            <Badge variant="neutral">Verified Mandi</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}

