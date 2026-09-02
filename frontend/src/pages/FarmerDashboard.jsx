import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCrops, createCrop, updateCrop, deleteCrop } from "../api/cropService";
import { getFarmerStats } from "../api/statsService";
import { useAuth } from "../context/AuthContext";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const EMOJI_OPTIONS = ["🌾","🍅","🥔","🥕","🌽","🥦","🧅","🧄","🥬","🫑","🍆","🥒","🫘","🍋"];
const CATEGORY_OPTIONS = ["vegetables","fruits","grains","herbs","other"];
const UNIT_OPTIONS = ["kg","lb","unit","bunch"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function CropFormModal({ isOpen, onClose, onSave, initialData = null }) {
  const isEdit = Boolean(initialData?._id);
  const [form, setForm] = useState({
    name: initialData?.name || "",
    subtitle: initialData?.subtitle || "",
    category: initialData?.category || "vegetables",
    quantity: initialData?.quantity ?? "",
    unit: initialData?.unit || "kg",
    pricePerUnit: initialData?.pricePerUnit ?? "",
    emoji: initialData?.emoji || "🌾",
    location: initialData?.location || "",
    badge: initialData?.badge || "",
    imageUrl: initialData?.imageUrl || "",
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        subtitle: initialData.subtitle || "",
        category: initialData.category || "vegetables",
        quantity: initialData.quantity ?? "",
        unit: initialData.unit || "kg",
        pricePerUnit: initialData.pricePerUnit ?? "",
        emoji: initialData.emoji || "🌾",
        location: initialData.location || "",
        badge: initialData.badge || "",
        imageUrl: initialData.imageUrl || "",
      });
    }
  }, [initialData]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (JPEG, PNG, WEBP, etc.).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size should be less than 10MB.");
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      const url = await uploadToCloudinary(file);
      set("imageUrl", url);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload image to Cloudinary.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || form.quantity === "" || form.pricePerUnit === "") {
      setError("Crop name, quantity, and price per unit are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        quantity: Number(form.quantity),
        pricePerUnit: Number(form.pricePerUnit),
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save crop listing.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Crop Listing" : "Add New Crop"}
      subtitle="Upload crop details and image for buyers"
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-lg">
            {error}
          </div>
        )}

        {/* Cloudinary Image Upload */}
        <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-lg space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
            Real Crop Image (Cloudinary)
          </label>

          {form.imageUrl ? (
            <div className="relative rounded-lg overflow-hidden border border-emerald-300 h-36 bg-slate-100">
              <img src={form.imageUrl} alt="Crop preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => set("imageUrl", "")}
                className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 text-xs hover:bg-red-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white p-4 rounded-lg text-center cursor-pointer transition-colors"
            >
              <span className="text-2xl block mb-1">📸</span>
              <p className="text-xs font-semibold text-emerald-900">
                {uploading ? "Uploading to Cloudinary..." : "Click to select or upload image"}
              </p>
              <p className="text-[11px] text-slate-500">Supports PNG, JPG, WEBP up to 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </div>
          )}
          {uploadError && <p className="text-xs text-red-600 font-medium">{uploadError}</p>}
        </div>

        <Input
          label="Crop Name"
          placeholder="e.g. Organic Tomatoes"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </Select>

          <Select
            label="Emoji Icon"
            value={form.emoji}
            onChange={(e) => set("emoji", e.target.value)}
          >
            {EMOJI_OPTIONS.map((em) => (
              <option key={em} value={em}>
                {em} Icon
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Quantity"
            type="number"
            placeholder="100"
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
            required
          />
          <Select
            label="Unit"
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
          >
            {UNIT_OPTIONS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
          <Input
            label="Price (₹/unit)"
            type="number"
            placeholder="40"
            value={form.pricePerUnit}
            onChange={(e) => set("pricePerUnit", e.target.value)}
            required
          />
        </div>

        <Input
          label="Location"
          placeholder="e.g. Mandi, Punjab"
          value={form.location}
          onChange={(e) => set("location", e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            {isEdit ? "Save Changes" : "Create Listing"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);

  const fetchCrops = useCallback(async () => {
    setLoadingCrops(true);
    try {
      const data = await getMyCrops();
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
      const data = await getFarmerStats();
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

  const handleCreateOrUpdateCrop = async (cropData) => {
    if (editingCrop?._id) {
      await updateCrop(editingCrop._id, cropData);
    } else {
      await createCrop(cropData);
    }
    fetchCrops();
    fetchStats();
  };

  const handleDeleteCrop = async (cropId) => {
    if (!window.confirm("Are you sure you want to delete this crop listing?")) return;
    try {
      await deleteCrop(cropId);
      fetchCrops();
      fetchStats();
    } catch (err) {
      alert("Failed to delete crop listing.");
    }
  };

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(search.toLowerCase()) ||
      (crop.location && crop.location.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      categoryFilter === "All" || crop.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "All" || crop.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Chart sales trend data fallback
  const salesChartData = stats?.salesTrend || [
    { month: "Jan", sales: 12000 },
    { month: "Feb", sales: 19000 },
    { month: "Mar", sales: 15000 },
    { month: "Apr", sales: 24000 },
    { month: "May", sales: 32000 },
    { month: "Jun", sales: 28000 },
  ];

  return (
    <AppShell
      activePath="/farmer/dashboard"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Farmer Dashboard"
      subtitle={`Welcome back, ${user?.name || "Farmer"}! Here is your agricultural summary.`}
      headerActions={
        <Button
          onClick={() => {
            setEditingCrop(null);
            setModalOpen(true);
          }}
          size="sm"
        >
          <span>+</span> Add New Crop
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Metrics */}
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
                title="Total Sales"
                value={fmt(stats?.totalRevenue || 0)}
                trend="up"
                trendLabel="+12%"
                description="from last month"
              />
              <StatCard
                title="Active Listings"
                value={stats?.activeCropsCount ?? crops.length}
                description="Live crops on market"
              />
              <StatCard
                title="Total Orders"
                value={stats?.totalOrdersCount ?? 0}
                description="Completed orders"
              />
              <StatCard
                title="Rating & Trust"
                value={`${stats?.rating ?? "4.8"} / 5.0`}
                description="Buyer feedback score"
              />
            </>
          )}
        </div>

        {/* Sales Chart & Quick Tools Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Sales Revenue Trend</CardTitle>
                <CardDescription>Monthly earnings from crop sales</CardDescription>
              </div>
              <Badge variant="success">Live Market Sync</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "0.5rem", fontSize: "0.75rem" }}
                      formatter={(val) => [fmt(val), "Revenue"]}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quick AI & Utility Tools */}
          <Card>
            <CardHeader>
              <CardTitle>AgriTech AI Services</CardTitle>
              <CardDescription>Instant intelligent farming tools</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                onClick={() => navigate("/disease-detection")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔬</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#0F4C2A]">AI Disease Detection</p>
                    <p className="text-[11px] text-slate-500">Scan plant leaves for early illness</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 text-sm">→</span>
              </button>

              <button
                onClick={() => navigate("/crop-recommendation")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🤖</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#0F4C2A]">Crop Recommendation</p>
                    <p className="text-[11px] text-slate-500">Soil NPK & climate-matched crops</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 text-sm">→</span>
              </button>

              <button
                onClick={() => navigate("/crop-prices")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📈</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#0F4C2A]">Live Mandi Ticker</p>
                    <p className="text-[11px] text-slate-500">Check current market price trends</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 text-sm">→</span>
              </button>

              <button
                onClick={() => navigate("/weather")}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⛅</span>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#0F4C2A]">Weather Forecast</p>
                    <p className="text-[11px] text-slate-500">Real-time agricultural weather</p>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 text-sm">→</span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* My Crops Listing Table */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>My Crop Listings</CardTitle>
              <CardDescription>Manage active crops, inventory levels, and prices</CardDescription>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Input
                placeholder="Search crops..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 text-xs py-1.5"
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-36 text-xs py-1.5"
              >
                <option value="All">All Categories</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loadingCrops ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : filteredCrops.length === 0 ? (
              <EmptyState
                icon={() => <span className="text-3xl">🌾</span>}
                title="No crop listings found"
                description="Create your first crop listing to start selling directly to verified buyers."
                actionLabel="+ Add New Crop"
                onAction={() => {
                  setEditingCrop(null);
                  setModalOpen(true);
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                      <th className="px-5 py-3.5">Crop Details</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Quantity</th>
                      <th className="px-5 py-3.5">Price / Unit</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCrops.map((crop) => (
                      <tr key={crop._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xl overflow-hidden shrink-0">
                              {crop.imageUrl ? (
                                <img src={crop.imageUrl} alt={crop.name} className="w-full h-full object-cover" />
                              ) : (
                                crop.emoji || "🌾"
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{crop.name}</p>
                              <p className="text-xs text-slate-500">{crop.location || "Location not set"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge variant="neutral">{crop.category}</Badge>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {crop.quantity} {crop.unit}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-700">
                          {fmt(crop.pricePerUnit)} / {crop.unit}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant={
                              crop.status === "available"
                                ? "success"
                                : crop.status === "reserved"
                                ? "warning"
                                : "neutral"
                            }
                          >
                            {crop.status || "Available"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingCrop(crop);
                                setModalOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteCrop(crop._id)}
                            >
                              Delete
                            </Button>
                          </div>
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

      {/* Crop Form Modal */}
      <CropFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingCrop(null);
        }}
        onSave={handleCreateOrUpdateCrop}
        initialData={editingCrop}
      />
    </AppShell>
  );
}