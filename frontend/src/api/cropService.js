// frontend/src/api/cropService.js
import api from "./axiosInstance";

// ── Marketplace.jsx ───────────────────────────────────
// Called when page loads and when filters change
// Supports: category, minPrice, maxPrice, status, search
export const getMarketplaceCrops = async (filters = {}) => {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== "" && v != null))
  ).toString();
  const { data } = await api.get(`/crops?${params}`);
  return data; // { success, count, data: Crop[] }
};

// ── FarmerDashboard.jsx ───────────────────────────────
// Get only logged-in farmer's own crop listings
export const getMyCrops = async () => {
  const { data } = await api.get("/crops/mine");
  return data; // { success, count, data: Crop[] }
};

// Add New Crop button → modal → submit
export const createCrop = async (cropData) => {
  // cropData: { name, subtitle, category, quantity, unit, pricePerUnit, badge, emoji, location }
  const { data } = await api.post("/crops", cropData);
  return data; // { success, data: Crop }
};

// Edit crop (⋯ menu → Edit)
export const updateCrop = async (id, cropData) => {
  const { data } = await api.put(`/crops/${id}`, cropData);
  return data;
};

// Delete crop (⋯ menu → Delete)
export const deleteCrop = async (id) => {
  const { data } = await api.delete(`/crops/${id}`);
  return data;
};