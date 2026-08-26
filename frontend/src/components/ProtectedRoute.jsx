// frontend/src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, token } = useAuth();

  // Not logged in → go to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role check — if allowedRoles is empty, any logged-in user can access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to correct home based on actual role
    if (user.role === "farmer") return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === "buyer")  return <Navigate to="/buyer/dashboard"  replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}