// frontend/src/api/requestService.js
import api from "./axiosInstance";

// ── MyOrders.jsx (Buyer) ──────────────────────────────
// Paginated list of buyer's own purchase requests
// status: "pending" | "accepted" | "rejected" | "cancelled" | undefined (all)
export const getMyRequests = async ({ status, page = 1, limit = 4 } = {}) => {
  const params = new URLSearchParams({
    ...(status && { status }),
    page,
    limit,
  }).toString();
  const { data } = await api.get(`/requests/my?${params}`);
  return data; // { success, total, page, pages, data: PurchaseRequest[] }
};

// ── RequestManagement.jsx (Farmer) ───────────────────
// Paginated list of incoming requests for this farmer
export const getIncomingRequests = async ({ status, page = 1, limit = 4, search } = {}) => {
  const params = new URLSearchParams({
    ...(status && { status }),
    ...(search && { search }),
    page,
    limit,
  }).toString();
  const { data } = await api.get(`/requests/incoming?${params}`);
  return data; // { success, total, page, pages, data: PurchaseRequest[] }
};

// ── Marketplace.jsx ───────────────────────────────────
// "Send Purchase Request" button on product card
export const createRequest = async ({ cropId, quantity, message, deliveryAddress, requestedDeliveryDate }) => {
  const { data } = await api.post("/requests", { cropId, quantity, message, deliveryAddress, requestedDeliveryDate });
  return data; // { success, data: PurchaseRequest }
};

// ── RequestManagement.jsx → ✓ (Accept) button ────────
export const acceptRequest = async (id) => {
  const { data } = await api.patch(`/requests/${id}/accept`);
  return data;
};

// ── RequestManagement.jsx → ✗ (Reject) button ────────
export const rejectRequest = async (id, reason = "") => {
  const { data } = await api.patch(`/requests/${id}/reject`, { reason });
  return data;
};

// ── MyOrders.jsx → Cancel button ─────────────────────
export const cancelRequest = async (id) => {
  const { data } = await api.patch(`/requests/${id}/cancel`);
  return data;
};

// ── MyOrders.jsx → Make Payment button ───────────────
// Creates an Order document after successful payment
export const payRequest = async (id, { paymentMethod = "card", transactionId = "" } = {}) => {
  const { data } = await api.post(`/requests/${id}/pay`, { paymentMethod, transactionId });
  return data; // { success, data: Order }
};