// frontend/src/api/weatherService.js
import api from "./axiosInstance";
export const getWeather  = async (params) => { const { data } = await api.get("/weather",          { params }); return data; };
export const getForecast = async (params) => { const { data } = await api.get("/weather/forecast",  { params }); return data; };
