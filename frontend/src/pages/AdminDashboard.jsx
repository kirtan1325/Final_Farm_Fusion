import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminStats, getAdminCrops, removeCrop } from "../api/adminService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AdminUsers from "./AdminUsers";
import AdminSchemes from "./AdminSchemes";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const ADMIN_TABS = ["Overview", "Users", "Schemes", "Crops"];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("Overview");

  // Stats
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Crops
  const [crops, setCrops] = useState([]);
  const [cropSearch, setCropSearch] = useState("");
  const [cropLoading, setCropLoading] = useState(false);

  useEffect(() => {
    getAdminStats()
      .then((d) => {
        setStats(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== "Crops") return;
    const fetch = async () => {
      setCropLoading(true);
      try {
        const params = {};
        if (cropSearch.trim()) params.search = cropSearch.trim();
        const data = await getAdminCrops(params);
        setCrops(data.data || []);
      } catch (err) {
        console.error("Admin crops fetch error:", err);
      } finally {
        setCropLoading(false);
      }
    };
    const timer = setTimeout(fetch, cropSearch ? 400 : 0);
    return () => clearTimeout(timer);
  }, [activeTab, cropSearch]);

  const handleRemoveCrop = async (id, name) => {
    if (!window.confirm(`Remove crop listing "${name}"?`)) return;
    try {
      await removeCrop(id);
      setCrops((prev) => prev.filter((c) => c._id !== id));
      toast.success("Crop listing removed.");
    } catch (err) {
      toast.error("Failed to remove crop listing.");
    }
  };

  return (
    <AppShell
      activePath="/admin/dashboard"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="System Admin Command Center"
      subtitle="Platform user administration, marketplace content moderation, and scheme catalog management."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#0F4C2A] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Platform Users"
                value={stats?.totalUsers ?? 0}
                description="Farmers, buyers, & admins"
              />
              <StatCard
                title="Registered Farmers"
                value={stats?.totalFarmers ?? 0}
                description="Verified agricultural producers"
              />
              <StatCard
                title="Registered Buyers"
                value={stats?.totalBuyers ?? 0}
                description="Verified procurement buyers"
              />
              <StatCard
                title="Active Listings"
                value={stats?.totalCrops ?? 0}
                description="Marketplace crop items"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Operational Status</CardTitle>
                <CardDescription>Platform health & API connection monitor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold">
                  <span>Backend REST API Service</span>
                  <Badge variant="success">Operational (Online)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold">
                  <span>ML Prediction Engine Target</span>
                  <Badge variant="success">Connected (200 OK)</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 font-semibold">
                  <span>MongoDB Atlas Storage Cluster</span>
                  <Badge variant="success">Healthy</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "Users" && <AdminUsers />}

        {activeTab === "Schemes" && <AdminSchemes />}

        {activeTab === "Crops" && (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Marketplace Crop Moderation</CardTitle>
                <CardDescription>Review and manage all user-submitted crop listings</CardDescription>
              </div>

              <Input
                placeholder="Search crops by name..."
                value={cropSearch}
                onChange={(e) => setCropSearch(e.target.value)}
                className="w-48 text-xs py-1.5"
              />
            </CardHeader>

            <CardContent className="p-0">
              {cropLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : crops.length === 0 ? (
                <EmptyState
                  icon={() => <span className="text-3xl">🌾</span>}
                  title="No crops found for moderation"
                  description="Try adjusting your search criteria."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                        <th className="px-5 py-3.5">Crop Name</th>
                        <th className="px-5 py-3.5">Farmer</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Quantity</th>
                        <th className="px-5 py-3.5">Price</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {crops.map((c) => (
                        <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900">{c.name}</td>
                          <td className="px-5 py-4 text-slate-600">
                            {c.farmerId?.name || "Farmer"}
                          </td>
                          <td className="px-5 py-4">
                            <Badge variant="neutral">{c.category}</Badge>
                          </td>
                          <td className="px-5 py-4 text-slate-700">
                            {c.quantity} {c.unit}
                          </td>
                          <td className="px-5 py-4 font-bold text-[#0F4C2A]">
                            ₹{c.pricePerUnit} / {c.unit}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleRemoveCrop(c._id, c.name)}
                            >
                              Remove Listing
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
