// frontend/src/api/cropPriceService.js
import api from "./axiosInstance";
import axios from "axios";

export const getCropPrices   = async (params = {}) => { 
    // Hit the ML backend for real-time live prices
    const { data } = await axios.get("http://localhost:5000/live-prices", { params }); 
    return data; 
};
export const addCropPrice    = async (body)         => { const { data } = await api.post("/prices",     body);       return data; };
export const updateCropPrice = async (id, body)     => { const { data } = await api.put(`/prices/${id}`, body);      return data; };
