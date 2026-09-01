import api from "./axiosInstance";

export const predictCrop = async (data) => {
  const response = await api.post(`/ai/predict-crop`, data);
  return response.data;
};

export const predictPrice = async (data) => {
  const response = await api.post(`/ai/predict-price`, data);
  return response.data;
};

export const detectDisease = async (payload) => {
  let headers = {};
  if (payload instanceof FormData) {
    headers["Content-Type"] = "multipart/form-data";
  } else {
    headers["Content-Type"] = "application/json";
  }
  const response = await api.post(`/ai/detect-disease`, payload, { headers });
  return response.data;
};

export const getAdvisory = async (data) => {
  const response = await api.post(`/ai/advisory`, data);
  return response.data;
};
