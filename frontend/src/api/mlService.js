import api from "./axiosInstance";

export const predictCrop = async (data) => {
  const response = await api.post(`/ai/predict-crop`, data);
  return response.data;
};

export const predictPrice = async (data) => {
  const response = await api.post(`/ai/predict-price`, data);
  return response.data;
};

export const detectDisease = async (formData) => {
  // formData can contain image or just strings depending on implementation
  const response = await api.post(`/ai/detect-disease`, formData, {
    headers: {
      "Content-Type": "application/json", // Adjusted since we are simulating without actual image processing for now
    },
  });
  return response.data;
};

export const getAdvisory = async (data) => {
  const response = await api.post(`/ai/advisory`, data);
  return response.data;
};
