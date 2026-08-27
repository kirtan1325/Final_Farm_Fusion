// frontend/src/api/adminService.js
import api from "./axiosInstance";

export const getAdminStats   = async ()             => { const { data } = await api.get("/admin/stats");                    return data; };
export const getUsers        = async (params = {})  => { const { data } = await api.get("/admin/users",    { params });     return data; };
export const approveUser     = async (id)            => { const { data } = await api.patch(`/admin/users/${id}/approve`);   return data; };
export const suspendUser     = async (id)            => { const { data } = await api.patch(`/admin/users/${id}/suspend`);   return data; };
export const deleteUser      = async (id)            => { const { data } = await api.delete(`/admin/users/${id}`);          return data; };
export const getAdminCrops   = async (params = {})  => { const { data } = await api.get("/admin/crops",    { params });     return data; };
export const removeCrop      = async (id)            => { const { data } = await api.delete(`/admin/crops/${id}`);          return data; };
export const togglePinPost   = async (id)            => { const { data } = await api.patch(`/admin/forum/${id}/pin`);       return data; };
