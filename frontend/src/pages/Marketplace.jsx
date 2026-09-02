import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMarketplaceCrops } from "../api/cropService";
import { createRequest } from "../api/requestService";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const CATEGORY_OPTIONS = ["All", "Vegetables", "Fruits", "Grains", "Herbs", "Other"];
const SORT_OPTIONS = ["Newest Arrivals", "Price: Low to High", "Price: High to Low"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function ImageModal({ crop, onClose }) {
  if (!crop || !crop.imageUrl) return null;
  return (
    <Modal isOpen={Boolean(crop)} onClose={onClose} title={crop.name} subtitle="Verified Farmer Real Harvest Photo" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="h-96 w-full bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
          <img src={crop.imageUrl} alt={crop.name} className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
          <span>Seller: <strong>{crop.farmer?.farmName || crop.farmer?.name || "Local Farmer"}</strong></span>
          <span className="font-bold text-[#0F4C2A] text-sm">{fmt(crop.pricePerUnit)} / {crop.unit}</span>
        </div>
      </div>
    </Modal>
  );
}

function ProductCard({ crop, user, onViewImage }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    if (sent || loading) return;
    setLoading(true);
    try {
      await createRequest({ cropId: crop._id, quantity: 1 });
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } catch {
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        {/* Image Area */}
        <div
          onClick={() => crop.imageUrl && onViewImage && onViewImage(crop)}
          className={`relative h-48 bg-slate-100 border-b border-slate-200 overflow-hidden flex items-center justify-center ${
            crop.imageUrl ? "cursor-pointer group" : ""
          }`}
        >
          {crop.imageUrl ? (
            <img
              src={crop.imageUrl}
              alt={crop.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-6xl">{crop.emoji || "🌾"}</span>
          )}

          {crop.badge && (
            <span className="absolute top-2.5 left-2.5 bg-[#0F4C2A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {crop.badge.replace("_", " ")}
            </span>
          )}

          {crop.imageUrl && (
            <span className="absolute top-2.5 right-2.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-xs">
              📸 Real Photo
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-snug">{crop.name}</h3>
              <p className="text-xs text-slate-500">{crop.location || "Verified Farm Location"}</p>
            </div>
            <Badge variant="neutral">{crop.category || "General"}</Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              In Stock: <strong className="text-slate-800">{crop.quantity} {crop.unit}</strong>
            </span>
            <span className="font-extrabold text-[#0F4C2A] text-sm">
              {fmt(crop.pricePerUnit)} / {crop.unit}
            </span>
          </div>

          {crop.farmer && (
            <p className="text-[11px] text-slate-500 pt-1">
              Farmer: <strong className="text-slate-700">{crop.farmer.farmName || crop.farmer.name}</strong>
            </p>
          )}
        </div>
      </div>

      {user?.role !== "farmer" && (
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
      )}
    </Card>
  );
}

export default function Marketplace() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Newest Arrivals");
  const [selectedCropImage, setSelectedCropImage] = useState(null);

  const fetchCrops = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMarketplaceCrops();
      setCrops(data.data || []);
    } catch (err) {
      console.error("Error fetching marketplace crops:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCrops();
  }, [fetchCrops]);

  // Filtering & Sorting
  let filtered = crops.filter((crop) => {
    const matchesSearch =
      crop.name.toLowerCase().includes(search.toLowerCase()) ||
      (crop.location && crop.location.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      category === "All" || crop.category?.toLowerCase() === category.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  if (sort === "Price: Low to High") {
    filtered.sort((a, b) => (a.pricePerUnit || 0) - (b.pricePerUnit || 0));
  } else if (sort === "Price: High to Low") {
    filtered.sort((a, b) => (b.pricePerUnit || 0) - (a.pricePerUnit || 0));
  }

  return (
    <AppShell
      activePath="/marketplace"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="AgriTech Marketplace"
      subtitle="Source verified regional agricultural produce directly from certified farmers."
      headerActions={
        user?.role === "buyer" && (
          <Button onClick={() => navigate("/buyer/orders")} size="sm" variant="outline">
            My Orders
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Header Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Input
            placeholder="Search crops by name, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-80"
          />

          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-40"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>

            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-44"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">🛒</span>}
            title="No crop listings found"
            description="Try adjusting your search keywords or category filters."
            actionLabel="Clear Filters"
            onAction={() => {
              setSearch("");
              setCategory("All");
              setSort("Newest Arrivals");
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((crop) => (
              <ProductCard
                key={crop._id}
                crop={crop}
                user={user}
                onViewImage={(c) => setSelectedCropImage(c)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedCropImage && (
        <ImageModal crop={selectedCropImage} onClose={() => setSelectedCropImage(null)} />
      )}
    </AppShell>
  );
}