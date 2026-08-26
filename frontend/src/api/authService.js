// frontend/src/api/authService.js
import api from "./axiosInstance";

// Called from FarmFusionLogin.jsx on login submit
// Only sends email + password — role comes back from the database
export const loginUser = async ({ email, password }) => {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user",  JSON.stringify(data.user));
  return data;
};

// Called from FarmFusionLogin.jsx on register submit
// Sends name, email, password, role (farmer or buyer) chosen by user
export const registerUser = async ({ name, email, password, role, farmName, companyName, location }) => {
  const { data } = await api.post("/auth/register", {
    name,
    email,
    password,
    role,
    farmName,
    companyName,
    location,
  });
  localStorage.setItem("token", data.token);
  localStorage.setItem("user",  JSON.stringify(data.user));
  return data;
};

export const getMe = async () => {
  const { data } = await api.get("/auth/me");
  return data.user;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};