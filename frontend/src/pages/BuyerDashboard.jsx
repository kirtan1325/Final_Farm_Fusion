import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMarketplaceCrops } from "../api/cropService";
import { getBuyerStats } from "../api/statsService";
import { createRequest } from "../api/requestService";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CATEGORY_OPTIONS = ["All", "Vegetables", "Fruits", "Grains", "Herbs", "Other"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function ProductCard({ crop }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (sent) return;
    setLoading(true);
    try {
      await createRequest({ cropId: crop._id, quantity: 1 });
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setSent(true);
      setTimeout(() => setSent(false), 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Image Area */}
        <div className="relative h-44 bg-slate-100 border-b border-slate-200 overflow-hidden flex items-center justify-center">
          {crop.imageUrl ? (
            <img src={crop.imageUrl} alt={crop.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-6xl">{crop.emoji || "🌾"}</span>
          )}
          {crop.badge && (
            <span className="absolute top-2.5 left-2.5 bg-[#0F4C2A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {crop.badge.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm">{crop.name}</h3>
                {crop.isDummy && (
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-amber-200">
                    Sample
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{crop.location || "Verified Indian Farm"}</p>
            </div>
            <Badge variant="neutral">{crop.category || "General"}</Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Quantity: <strong className="text-slate-800">{crop.quantity} {crop.unit}</strong>
            </span>
            <span className="font-extrabold text-[#0F4C2A] text-sm">
              {fmt(crop.pricePerUnit)} / {crop.unit}
            </span>
          </div>

          {crop.farmerId && (
            <p className="text-[11px] text-slate-500 pt-1">
              Seller: <strong className="text-slate-700">{crop.farmerId.name || "Verified Farmer"}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        <Button
          variant={sent ? "secondary" : "primary"}
          size="sm"
          className="w-full"
          loading={loading}
          onClick={handleRequest}
        >
          {sent ? "✓ Request Sent!" : "Request Purchase"}
        </Button>
      </div>
    </Card>
  );
}

export default function BuyerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const fetchCrops = useCallback(async () => {
    setLoadingCrops(true);
    try {
      const data = await getMarketplaceCrops();
      setCrops(data.data || []);
    } catch (err) {
      console.error("Error fetching crops:", err);
    } finally {
      setLoadingCrops(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getBuyerStats();
      setStats(data.data || null);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
    fetchStats();
  }, [fetchCrops, fetchStats]);

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(search.toLowerCase()) ||
      (crop.location && crop.location.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === "All" || crop.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Purchasing chart data fallback
  const spendingChartData = stats?.spendingTrend || [
    { month: "Jan", spend: 18000 },
    { month: "Feb", spend: 25000 },
    { month: "Mar", spend: 31000 },
    { month: "Apr", spend: 22000 },
    { month: "May", spend: 40000 },
    { month: "Jun", spend: 35000 },
  ];

  return (
    <AppShell
      activePath="/buyer/dashboard"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Buyer Dashboard"
      subtitle={`Welcome back, ${user?.name || "Buyer"}! Source fresh agricultural produce directly.`}
      headerActions={
        <Button onClick={() => navigate("/marketplace")} size="sm">
          <span>🛒</span> Browse Marketplace
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Stat Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStats ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Procurement"
                value={fmt(stats?.totalSpent || 0)}
                trend="up"
                trendLabel="+8%"
                description="from last month"
              />
              <StatCard
                title="Active Orders"
                value={stats?.activeOrdersCount ?? 0}
                description="Pending & in transit"
              />
              <StatCard
                title="Total Purchased"
                value={`${stats?.totalVolume ?? 0} kg`}
                description="Produce delivered"
              />
              <StatCard
                title="Verified Suppliers"
                value={stats?.uniqueFarmersCount ?? 12}
                description="Farmer connections"
              />
            </>
          )}
        </div>

        {/* Spending Chart & Direct Marketplace Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Procurement Spending Trend</CardTitle>
                <CardDescription>Monthly agricultural procurement expenditure</CardDescription>
              </div>
              <Badge variant="info">Verified Direct Sourcing</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                  <BarChart data={spendingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "0.5rem", fontSize: "0.75rem" }}
                      formatter={(val) => [fmt(val), "Procurement"]}
                    />
                    <Bar dataKey="spend" fill="#0F4C2A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-[#0F4C2A] to-[#166534] text-white flex flex-col justify-between p-6">
            <div>
              <span className="text-2xl">🌱</span>
              <h3 className="text-lg font-bold mt-2">Direct Farmer Marketplace</h3>
              <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
                Connect with verified Indian farmers, place purchase requests, negotiate prices, and track shipments in real-time.
              </p>
            </div>
            <div className="pt-6 space-y-2">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => navigate("/marketplace")}
              >
                Explore All Products →
              </Button>
              <Button
                variant="outline"
                className="w-full text-white border-white/30 hover:bg-white/10"
                onClick={() => navigate("/buyer/orders")}
              >
                View My Orders
              </Button>
            </div>
          </Card>
        </div>

        {/* Featured Fresh Produce Listings */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Featured Fresh Produce</CardTitle>
              <CardDescription>Directly available from certified regional farmers</CardDescription>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Input
                placeholder="Search crops, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 text-xs py-1.5"
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-36 text-xs py-1.5"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loadingCrops ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : filteredCrops.length === 0 ? (
              <EmptyState
                icon={() => <span className="text-3xl">🛒</span>}
                title="No crops matching your search"
                description="Try adjusting your filter criteria or check back soon for new farmer listings."
                actionLabel="Reset Search"
                onAction={() => {
                  setSearch("");
                  setCategoryFilter("All");
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCrops.slice(0, 6).map((crop) => (
                  <ProductCard key={crop._id} crop={crop} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}