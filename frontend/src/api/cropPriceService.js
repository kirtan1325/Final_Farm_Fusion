// frontend/src/api/cropPriceService.js
import api from "./axiosInstance";

export const getCropPrices = async (params = {}) => {
  try {
    const { data } = await api.get("/prices", { params });
    return data;
  } catch (err) {
    console.warn("Crop prices fetch error:", err);
    return { success: true, data: [] };
  }
};

export const addCropPrice = async (body) => {
  const { data } = await api.post("/prices", body);
  return data;
};

export const updateCropPrice = async (id, body) => {
  const { data } = await api.put(`/prices/${id}`, body);
  return data;
};
