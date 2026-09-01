import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getMyCrops, createCrop, updateCrop, deleteCrop } from "../api/cropService";
import { getFarmerStats } from "../api/statsService";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import GoogleTranslate from "../components/GoogleTranslate";
import { uploadToCloudinary } from "../utils/cloudinaryUpload";

// ── Icons ──────────────────────────────────────────────
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const CropIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22V12M12 12C12 7 7 3 2 3c0 5 4 9 10 9zM12 12c0-5 5-9 10-9-1 5-5 9-10 9" />
  </svg>
);
const SalesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);
const RequestsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const TrendUpIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const TrendDownIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
  </svg>
);
const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />
  </svg>
);
const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard",   path: "/farmer/dashboard",   icon: <DashboardIcon /> },
  { id: "crops",       label: "My Crops",    path: "/farmer/dashboard",   icon: <CropIcon /> },
  { id: "sales",       label: "Sales",       path: "/farmer/sales",       icon: <SalesIcon /> },
  { id: "requests",    label: "Requests",    path: "/farmer/requests",    icon: <RequestsIcon /> },
  { id: "inventory",   label: "Inventory",   path: "/farmer/inventory",   icon: <SalesIcon /> },
  { id: "soil-health", label: "Soil Health", path: "/farmer/soil-health", icon: <RequestsIcon /> },
  { id: "messages",    label: "Messages",    path: "/messages",           icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
  { id: "crop-ai",     label: "Crop AI",     path: "/crop-recommendation",icon: <DashboardIcon /> },
  { id: "disease-ai",  label: "Disease AI",  path: "/disease-detection",  icon: <CropIcon /> },
  { id: "settings",    label: "Settings",    path: "/farmer/settings",    icon: <SettingsIcon /> },
];

const EMOJI_OPTIONS = ["🌾","🍅","🥔","🥕","🌽","🥦","🧅","🧄","🥬","🫑","🍆","🥒","🫘","🍋"];
const CATEGORY_OPTIONS = ["vegetables","fruits","grains","herbs","other"];
const UNIT_OPTIONS = ["kg","lb","unit","bunch"];

// ── Helpers ─────────────────────────────────────────────
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const getStatusClass = (s) =>
  s === "available"
    ? "ff-badge ff-status-available"
    : s === "reserved"
    ? "ff-badge ff-status-reserved"
    : s === "sold"
    ? "ff-badge ff-status-sold"
    : "ff-badge ff-badge-gray";

// ── Crop Form Modal (Add & Edit with Cloudinary Upload) ───
function CropFormModal({ onClose, onSave, initialData = null }) {
  const isEdit = Boolean(initialData?._id);
  const [form, setForm] = useState({
    name:         initialData?.name || "",
    subtitle:     initialData?.subtitle || "",
    category:     initialData?.category || "vegetables",
    quantity:     initialData?.quantity ?? "",
    unit:         initialData?.unit || "kg",
    pricePerUnit: initialData?.pricePerUnit ?? "",
    emoji:        initialData?.emoji || "🌾",
    location:     initialData?.location || "",
    badge:        initialData?.badge || "",
    imageUrl:     initialData?.imageUrl || "",
  });

  const [saving,      setSaving]      = useState(false);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive,  setDragActive]  = useState(false);
  const [error,       setError]       = useState("");

  const fileInputRef = useRef(null);

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

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
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
    <div className="ff-modal-overlay z-50">
      <div className="ff-modal ff-scale-in max-w-xl w-full my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shadow-md text-white"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            >
              🌱
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                {isEdit ? "Edit Crop Listing" : "Add New Crop"}
              </h3>
              <p className="text-xs text-gray-500">
                Upload real crop images via Cloudinary for buyers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
          >
            <XIcon />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto flex-1">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* ☁️ Cloudinary Real Image Upload */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  <path d="M12 12v6" /><path d="m9 15 3-3 3 3" />
                </svg>
                Real Crop Image (Cloudinary)
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                ☁️ Cloudinary Enabled
              </span>
            </div>

            {uploadError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                {uploadError}
              </div>
            )}

            {/* Preview or Dropzone */}
            {form.imageUrl ? (
              <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-400 bg-white shadow-sm flex items-center justify-center min-h-[160px] max-h-[220px]">
                <img
                  src={form.imageUrl}
                  alt="Crop preview"
                  className="w-full h-48 object-cover rounded-lg"
                  onError={() => setUploadError("Unable to load preview image.")}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-bold shadow-lg hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    Change Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => set("imageUrl", "")}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold shadow-lg hover:bg-red-700 transition-all cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
                <div className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                  ✅ Real Image Attached
                </div>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-emerald-500 bg-emerald-100/50 scale-[0.99]"
                    : "border-emerald-200 hover:border-emerald-400 bg-white/80"
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2 py-3">
                    <span className="ff-spinner" style={{ width: "24px", height: "24px", borderWidth: "3px" }} />
                    <p className="text-xs font-semibold text-emerald-700 animate-pulse">
                      Uploading real image to Cloudinary...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl shadow-sm">
                      📸
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Drag & drop crop photo here, or <span className="text-emerald-600 underline">browse</span>
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        High quality real photos increase buyer trust and sales! (PNG, JPG, WEBP)
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            />

            {/* Direct Image URL input option */}
            <div className="mt-1">
              <label className="text-[11px] font-medium text-gray-500 block mb-1">
                Or paste direct image URL:
              </label>
              <input
                type="url"
                placeholder="https://res.cloudinary.com/..."
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                className="ff-input text-xs py-1.5"
              />
            </div>
          </div>

          {/* Crop Icon Picker */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              Fallback Crop Emoji Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set("emoji", e)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                    form.emoji === e
                      ? "ring-2 ring-emerald-500 shadow-md"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  style={form.emoji === e ? { background: "linear-gradient(135deg,#d1fae5,#a7f3d0)" } : {}}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: "Crop Name *",  key: "name",     type: "text", placeholder: "e.g. Fresh Organic Tomatoes" },
            { label: "Subtitle",     key: "subtitle", type: "text", placeholder: "e.g. Harvested 2 days ago" },
            { label: "Location",     key: "location", type: "text", placeholder: "e.g. California Farm" },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                {f.label}
              </label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => set(f.key, e.target.value)}
                className="ff-input"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="ff-input cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Unit</label>
              <select
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
                className="ff-input cursor-pointer"
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Quantity *</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 500"
                value={form.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                className="ff-input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Price / {form.unit} * ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 2.50"
                value={form.pricePerUnit}
                onChange={(e) => set("pricePerUnit", e.target.value)}
                className="ff-input"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="ff-btn ff-btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="ff-btn ff-btn-primary flex-1 disabled:opacity-60"
          >
            {saving ? (
              <span className="ff-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
            ) : null}
            {saving ? "Saving..." : isEdit ? "Update Crop" : "Save Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox Image Modal ─────────────────────────────────
function ImageLightboxModal({ imageUrl, title, onClose }) {
  if (!imageUrl) return null;
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 ff-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              Real Crop Image
            </span>
            <span className="text-sm font-semibold text-white truncate">{title}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <XIcon />
          </button>
        </div>
        <div className="flex items-center justify-center p-4 max-h-[75vh] bg-black/50">
          <img
            src={imageUrl}
            alt={title || "Real Crop"}
            className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────
function Sidebar({ active, setActive, open, setOpen, user, onLogout, onNavigate }) {
  const { badges } = useNotifications();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setOpen(false)} />
      )}
      <aside
        className={`ff-sidebar fixed top-0 left-0 h-full w-60 z-30
          flex flex-col justify-between py-6 px-4 transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto lg:h-screen`}>

        {/* Logo */}
        <div>
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-lg"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              🚜
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block leading-tight">Farm Fusion</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Farmer Portal</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4 mx-2" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const badgeCount = badges[item.path] || 0;
              const isActive = active === item.id;
              return (
                <button key={item.id}
                  onClick={() => { setActive(item.id); setOpen(false); onNavigate(item.path); }}
                  className={`ff-nav-item ${isActive ? "active" : ""}`}>
                  <span className="ff-nav-icon">{item.icon}</span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ff-badge-pulse">
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Language Selector */}
        <div className="px-2 mb-4 mt-2">
          <GoogleTranslate />
        </div>

        {/* Bottom User Card */}
        <div>
          <div className="mx-2 mb-2" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
          <div className="ff-glass flex items-center gap-3 px-3 py-3 rounded-xl mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user?.name || "Farmer"}</p>
              <p className="text-xs capitalize truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                {user?.tierLevel || "member"}
              </p>
            </div>
          </div>
          <button onClick={onLogout}
            className="ff-nav-item w-full hover:text-red-400"
            style={{ color: "rgba(255,255,255,0.45)" }}>
            <LogoutIcon />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Shimmer Loading State ───────────────────────────────
function ShimmerLoading() {
  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Sidebar placeholder */}
      <aside className="ff-sidebar hidden lg:flex w-60 flex-col py-6 px-4 gap-4 flex-shrink-0">
        <div className="ff-shimmer h-9 w-36 rounded-xl mb-4" />
        {[...Array(7)].map((_, i) => (
          <div key={i} className="ff-shimmer h-10 rounded-xl" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar shimmer */}
        <div className="ff-topbar gap-4">
          <div className="ff-shimmer h-8 w-48 rounded-lg" />
          <div className="flex-1" />
          <div className="ff-shimmer h-9 w-52 rounded-xl hidden md:block" />
          <div className="ff-shimmer h-9 w-32 rounded-xl" />
        </div>

        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
          {/* Stat card shimmers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="ff-card p-5">
                <div className="ff-shimmer h-3 w-24 rounded mb-3" />
                <div className="ff-shimmer h-8 w-20 rounded mb-3" />
                <div className="ff-shimmer h-3 w-32 rounded" />
              </div>
            ))}
          </div>

          {/* Table shimmer */}
          <div className="ff-card overflow-hidden">
            <div className="ff-section-header">
              <div className="ff-shimmer h-6 w-40 rounded" />
              <div className="ff-shimmer h-4 w-16 rounded" />
            </div>
            <div className="p-4 flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-2">
                  <div className="ff-shimmer w-11 h-11 rounded-xl flex-shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="ff-shimmer h-4 w-40 rounded" />
                    <div className="ff-shimmer h-3 w-24 rounded" />
                  </div>
                  <div className="ff-shimmer h-4 w-16 rounded hidden sm:block" />
                  <div className="ff-shimmer h-4 w-20 rounded hidden sm:block" />
                  <div className="ff-shimmer h-6 w-20 rounded-full hidden sm:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────
export default function FarmerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [active, setActive]          = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [menuOpenId, setMenuOpenId]   = useState(null);

  // API state
  const [crops,   setCrops]   = useState([]);
  const [stats,   setStats]   = useState({ activeListings: 0, totalSales: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [cropsData, statsData] = await Promise.all([getMyCrops(), getFarmerStats()]);
      setCrops(cropsData.data);
      setStats(statsData);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveCrop = async (cropData) => {
    if (editingCrop?._id) {
      await updateCrop(editingCrop._id, cropData);
    } else {
      await createCrop(cropData);
    }
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this crop listing?")) return;
    try {
      await deleteCrop(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed.");
    }
    setMenuOpenId(null);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const filteredCrops = crops.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.subtitle || "").toLowerCase().includes(search.toLowerCase())
  );

  const STAT_CARDS = [
    {
      label: "Active Listings", value: stats.activeListings, trend: "Live count", up: true,
      variant: "emerald",
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
      iconBg: "rgba(16,185,129,0.12)", iconColor: "#10b981",
    },
    {
      label: "Total Sales", value: fmt(stats.totalSales), trend: "All time revenue", up: true,
      variant: "blue",
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9 12h6M12 9v6" /></svg>,
      iconBg: "rgba(59,130,246,0.12)", iconColor: "#3b82f6",
    },
    {
      label: "Pending Requests", value: stats.pendingRequests, trend: "Awaiting review", up: stats.pendingRequests === 0,
      variant: "amber",
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="12" y2="17" /></svg>,
      iconBg: "rgba(245,158,11,0.12)", iconColor: "#f59e0b",
    },
  ];

  const staggerClasses = ["ff-stagger-1", "ff-stagger-2", "ff-stagger-3"];

  if (loading) return <ShimmerLoading />;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {showModal && (
        <CropFormModal
          initialData={editingCrop}
          onClose={() => { setShowModal(false); setEditingCrop(null); }}
          onSave={handleSaveCrop}
        />
      )}

      {selectedImage && (
        <ImageLightboxModal
          imageUrl={selectedImage.url}
          title={selectedImage.name}
          onClose={() => setSelectedImage(null)}
        />
      )}

      <Sidebar active={active} setActive={setActive} open={sidebarOpen} setOpen={setSidebarOpen}
        user={user} onLogout={handleLogout} onNavigate={navigate} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* ── Top bar ── */}
        <header className="ff-topbar flex-shrink-0 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors cursor-pointer p-1 rounded-lg hover:bg-gray-100 mr-1">
            <MenuIcon />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate leading-tight">
              Welcome back, <span className="ff-gradient-text">{user?.name?.split(" ")[0] || "Farmer"}</span>!
            </h1>
            <p className="text-gray-500 text-xs mt-0.5 hidden sm:block">
              Here's what's happening on your farm today.
            </p>
          </div>

          {/* Search — desktop */}
          <div className="ff-input-group hidden md:flex w-56 lg:w-64">
            <SearchIcon />
            <input type="text" placeholder="Search crops…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>

          <button onClick={() => { setEditingCrop(null); setShowModal(true); }} className="ff-btn ff-btn-primary flex-shrink-0">
            <PlusIcon />
            <span className="hidden sm:inline">Add New Crop</span>
            <span className="sm:hidden">Add</span>
          </button>
        </header>

        {/* Mobile search */}
        <div className="md:hidden px-4 pt-3 pb-1">
          <div className="ff-input-group">
            <SearchIcon />
            <input type="text" placeholder="Search crops…" value={search}
              onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

          {/* Error banner */}
          {error && (
            <div className="ff-fade-in bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
              <button onClick={fetchData} className="text-xs font-semibold underline cursor-pointer ml-4 hover:text-red-900 transition-colors">Retry</button>
            </div>
          )}

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STAT_CARDS.map((s, i) => (
              <div key={s.label} className={`ff-stat-card ${s.variant} ff-fade-in ${staggerClasses[i]}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className="text-3xl font-extrabold text-gray-900 leading-none">{s.value}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: s.iconBg, color: s.iconColor }}>
                    {s.icon}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${s.up ? "text-emerald-600" : "text-amber-600"}`}>
                  {s.up ? <TrendUpIcon /> : <TrendDownIcon />}
                  {s.trend}
                </div>
              </div>
            ))}
          </div>

          {/* ── Crop Listings ── */}
          <div className="ff-card ff-fade-in ff-stagger-4 overflow-hidden">
            <div className="ff-section-header">
              <div>
                <h2 className="text-base font-bold text-gray-900">My Crop Listings</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filteredCrops.length} crop{filteredCrops.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <span className="ff-badge ff-badge-green">
                {stats.activeListings} Active
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="ff-table">
                <thead>
                  <tr>
                    {["Crop Details", "Quantity", "Price", "Status", "Actions"].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCrops.map((crop) => (
                    <tr key={crop._id} className="relative">
                      <td>
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => crop.imageUrl && setSelectedImage({ url: crop.imageUrl, name: crop.name })}
                            className={`w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0 border border-gray-200 overflow-hidden ${
                              crop.imageUrl ? "cursor-pointer group hover:border-emerald-500 hover:shadow-md transition-all relative" : ""
                            }`}
                          >
                            {crop.imageUrl ? (
                              <>
                                <img src={crop.imageUrl} alt={crop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                                  🔍
                                </div>
                              </>
                            ) : (
                              crop.emoji || "🌾"
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{crop.name}</p>
                              {crop.imageUrl && (
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                                  📸 Real Photo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{crop.subtitle || crop.location || ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-gray-700">{crop.quantity} {crop.unit}</td>
                      <td className="font-semibold text-gray-900">${crop.pricePerUnit?.toFixed(2)} / {crop.unit}</td>
                      <td>
                        <span className={`${getStatusClass(crop.status)} capitalize`}>
                          {crop.status}
                        </span>
                      </td>
                      <td className="relative">
                        <button onClick={() => setMenuOpenId(menuOpenId === crop._id ? null : crop._id)}
                          className="text-gray-400 hover:text-gray-700 transition-colors cursor-pointer p-1.5 rounded-lg hover:bg-gray-100">
                          <DotsIcon />
                        </button>
                        {menuOpenId === crop._id && (
                          <div className="absolute right-4 top-12 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 min-w-[130px] ff-scale-in">
                            <button onClick={() => { setEditingCrop(crop); setShowModal(true); setMenuOpenId(null); }}
                              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
                              Edit
                            </button>
                            <button onClick={() => handleDelete(crop._id)}
                              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors">
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredCrops.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <span className="text-5xl">🌾</span>
                          <p className="text-sm font-medium">
                            {crops.length === 0
                              ? "No crop listings yet. Click Add New Crop to get started."
                              : "No crops match your search."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-gray-100">
              {filteredCrops.map((crop) => (
                <div key={crop._id} className="flex items-start gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
                  <div
                    onClick={() => crop.imageUrl && setSelectedImage({ url: crop.imageUrl, name: crop.name })}
                    className={`w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${
                      crop.imageUrl ? "cursor-pointer relative" : ""
                    }`}
                  >
                    {crop.imageUrl ? (
                      <img src={crop.imageUrl} alt={crop.name} className="w-full h-full object-cover" />
                    ) : (
                      crop.emoji || "🌾"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-gray-900 text-sm">{crop.name}</p>
                          {crop.imageUrl && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded">
                              📸 Photo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{crop.subtitle || ""}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingCrop(crop); setShowModal(true); }}
                          className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button onClick={() => handleDelete(crop._id)}
                          className="text-gray-400 hover:text-red-500 flex-shrink-0 cursor-pointer text-xs font-semibold transition-colors hover:bg-red-50 px-2 py-1 rounded-lg">
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs text-gray-500">{crop.quantity} {crop.unit}</span>
                      <span className="text-gray-300 text-xs">·</span>
                      <span className="text-xs font-semibold text-gray-900">${crop.pricePerUnit?.toFixed(2)} / {crop.unit}</span>
                      <span className={`${getStatusClass(crop.status)} capitalize`}>
                        {crop.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {filteredCrops.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
                  <span className="text-4xl">🌾</span>
                  <p className="text-sm">
                    {crops.length === 0 ? "No listings yet." : "No crops match your search."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}