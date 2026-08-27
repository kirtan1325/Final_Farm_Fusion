// frontend/src/api/schemeService.js
import api from "./axiosInstance";
export const getSchemes    = async (params = {}) => { const { data } = await api.get("/schemes",          { params }); return data; };
export const getScheme     = async (id)           => { const { data } = await api.get(`/schemes/${id}`);               return data; };
export const createScheme  = async (body)         => { const { data } = await api.post("/schemes",         body);      return data; };
export const updateScheme  = async (id, body)     => { const { data } = await api.put(`/schemes/${id}`,    body);      return data; };
export const deleteScheme  = async (id)           => { const { data } = await api.delete(`/schemes/${id}`);            return data; };

// frontend/src/api/advisoryService.js (append below or in separate file)
export const getAdvisory   = async (params = {}) => { const { data } = await api.get("/advisory",          { params }); return data; };
export const getCropNames  = async ()             => { const { data } = await api.get("/advisory/crops");               return data; };
export const createAdvisory = async (body)        => { const { data } = await api.post("/advisory",         body);      return data; };
export const updateAdvisory = async (id, body)    => { const { data } = await api.put(`/advisory/${id}`,    body);      return data; };
