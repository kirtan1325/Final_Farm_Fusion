// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored && stored !== "undefined" && stored !== "null" ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      localStorage.removeItem("user");
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      const tok = localStorage.getItem("token");
      return tok && tok !== "undefined" && tok !== "null" ? tok : null;
    } catch (e) {
      return null;
    }
  });

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoggedIn: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};