import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdvisory, getCropNames } from "../api/schemeService";
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

function AdvisoryModal({ item, onClose }) {
  if (!item) return null;
  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} title={`${item.cropName} Advisory`} subtitle={`Seasonal Guide for ${item.season}`} maxWidth="max-w-xl">
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant="emerald">{item.season}</Badge>
          <Badge variant="neutral">Water Need: {item.waterRequirement || "Medium"}</Badge>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">Optimal Soil Type</h4>
          <p className="text-xs text-slate-600">{item.soilType || "Loamy to sandy loam with good drainage"}</p>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">Sowing & Harvest Period</h4>
          <p className="text-xs text-slate-600">{item.sowingPeriod || "Sowing: Jun - Jul | Harvesting: Oct - Nov"}</p>
        </div>

        <div className="space-y-1">
          <h4 className="font-bold text-slate-900">Common Pests & Disease Prevention</h4>
          <p className="text-xs text-slate-600">{item.pestInfo || "Monitor for aphids and blights. Use organic neem sprays preventatively."}</p>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
          <h4 className="font-bold text-[#0F4C2A]">Best Practice Guidance</h4>
          <p className="text-xs text-emerald-900">{item.bestPractices || "Maintain balanced NPK fertilizer ratio and ensure field drainage."}</p>
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

  return (
    <AppShell
      activePath="/advisory"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Agronomic Crop Advisory"
      subtitle="Seasonal cultivation guides, pest management strategies, and optimal soil practices."
    >
      <div className="space-y-6 max-w-5xl mx-auto">
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
            title="No advisory guides found"
            description="Try adjusting your crop search query or season filter."
            actionLabel="Reset Search"
            onAction={() => {
              setSearch("");
              setSeason("All");
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
