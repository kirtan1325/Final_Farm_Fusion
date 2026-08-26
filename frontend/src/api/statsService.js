// frontend/src/api/statsService.js
import api from "./axiosInstance";

// ── FarmerDashboard.jsx ───────────────────────────────
// Powers the 3 stat cards: Active Listings, Total Sales, Pending Requests
export const getFarmerStats = async () => {
  const { data } = await api.get("/stats/farmer");
  return data.data;
  // Returns: { activeListings: Number, totalSales: Number, pendingRequests: Number }
};

// ── BuyerDashboard.jsx ────────────────────────────────
// Powers the 3 stat cards: Active Requests, Crops Saved, Recent Purchases
export const getBuyerStats = async () => {
  const { data } = await api.get("/stats/buyer");
  return data.data;
  // Returns: { activeRequests: Number, cropsSaved: Number, recentPurchases: Number }
};

// ── RequestManagement.jsx ─────────────────────────────
// Powers the 3 bottom stat cards: Pending Value, Accepted Today, Response Rate
export const getRequestStats = async () => {
  const { data } = await api.get("/stats/requests");
  return data.data;
  // Returns: { pendingValue: Number, acceptedToday: Number, responseRate: String }
};