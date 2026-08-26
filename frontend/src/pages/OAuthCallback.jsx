// frontend/src/pages/OAuthCallback.jsx
// This page handles the redirect from Google/Facebook OAuth
// URL looks like: /auth/callback?token=xxx&user=xxx

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { login }      = useAuth();
  const navigate       = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      // OAuth failed — go back to login with error message
      navigate("/login?error=" + error);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        // Store in context + localStorage (same as email login)
        login({ token, user });
        // Redirect to correct dashboard based on role
        if (user.role === "farmer")      navigate("/farmer/dashboard");
        else if (user.role === "buyer")  navigate("/buyer/dashboard");
        else                             navigate("/marketplace");
      } catch {
        navigate("/login?error=invalid_callback");
      }
    } else {
      navigate("/login");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <svg className="animate-spin w-10 h-10 text-green-700 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-gray-600 font-medium">Completing sign in...</p>
      </div>
    </div>
  );
}