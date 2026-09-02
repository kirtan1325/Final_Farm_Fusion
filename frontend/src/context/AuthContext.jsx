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

  const login = (arg1, arg2) => {
    let finalUser = null;
    let finalToken = null;

    if (arg1 && typeof arg1 === "object" && (arg1.user || arg1.token)) {
      // Called as login({ user, token }) or login(data)
      finalUser = arg1.user;
      finalToken = arg1.token;
    } else if (typeof arg1 === "string" && typeof arg2 === "object") {
      // Called as login(token, user)
      finalToken = arg1;
      finalUser = arg2;
    } else if (typeof arg1 === "object" && typeof arg2 === "string") {
      // Called as login(user, token)
      finalUser = arg1;
      finalToken = arg2;
    }

    if (finalToken) localStorage.setItem("token", finalToken);
    if (finalUser) localStorage.setItem("user", JSON.stringify(finalUser));

    setToken(finalToken);
    setUser(finalUser);
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