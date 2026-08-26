// frontend/src/api/orderService.js
import api from "./axiosInstance";

// ── MyOrders.jsx (Buyer) ──────────────────────────────
// Track delivery status after payment
export const getMyOrders = async () => {
  const { data } = await api.get("/orders/my");
  return data; // { success, count, data: Order[] }
};

// ── FarmerDashboard.jsx (Farmer) ─────────────────────
// See all orders farmer needs to fulfill / has shipped
export const getFarmerOrders = async () => {
  const { data } = await api.get("/orders/fulfilled");
  return data;
};

// ── FarmerDashboard.jsx (Farmer) ─────────────────────
// Update shipping/delivery status
// status: "processing" | "shipped" | "delivered" | "cancelled"
export const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data;
};
