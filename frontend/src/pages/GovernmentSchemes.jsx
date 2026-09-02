import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSchemes } from "../api/schemeService";
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

const CATEGORIES = ["All", "subsidy", "loan", "insurance", "training", "equipment", "other"];

function SchemeModal({ scheme, onClose }) {
  if (!scheme) return null;
  return (
    <Modal isOpen={Boolean(scheme)} onClose={onClose} title={scheme.title} subtitle={`Category: ${scheme.category?.toUpperCase() || "GOVERNMENT SCHEME"}`} maxWidth="max-w-xl">
      <div className="space-y-4 text-sm">
        <p className="text-xs text-slate-600 leading-relaxed">{scheme.description}</p>

        {scheme.benefits && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
            <h4 className="font-bold text-[#0F4C2A] text-xs uppercase tracking-wider">Financial Benefits</h4>
            <p className="text-xs text-emerald-900">{scheme.benefits}</p>
          </div>
        )}

        {scheme.eligibility && (
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Eligibility Criteria</h4>
            <p className="text-xs text-slate-600">{scheme.eligibility}</p>
          </div>
        )}

        {scheme.applicationLink && (
          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <a
              href={scheme.applicationLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F4C2A] text-white text-xs font-bold rounded-lg hover:bg-[#0A341C] transition-colors"
            >
              Apply via Official Portal ↗
            </a>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function GovernmentSchemes() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {};
        if (category !== "All") params.category = category;
        if (search.trim()) params.search = search.trim();
        const data = await getSchemes(params);
        setSchemes(data.data || []);
      } catch (err) {
        console.error("Schemes fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [category, search]);

  return (
    <AppShell
      activePath="/schemes"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Government Agricultural Schemes"
      subtitle="Discover central & state government subsidies, low-interest crop loans, and agricultural welfare portals."
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Input
            placeholder="Search schemes (e.g. PM-KISAN, Drip Irrigation)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-80"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  category === c
                    ? "bg-[#0F4C2A] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Schemes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </div>
        ) : schemes.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">🏛️</span>}
            title="No government schemes found"
            description="Try adjusting your search or switching categories."
            actionLabel="Reset Search"
            onAction={() => {
              setSearch("");
              setCategory("All");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {schemes.map((sch) => (
              <Card key={sch._id} className="hover:shadow-md transition-shadow flex flex-col justify-between p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{sch.title}</h3>
                    <Badge variant="emerald">{sch.category || "General"}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {sch.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">
                    {sch.benefits ? "Subsidy Available" : "Government Welfare"}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setSelectedScheme(sch)}>
                    View Details →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SchemeModal scheme={selectedScheme} onClose={() => setSelectedScheme(null)} />
    </AppShell>
  );
}
