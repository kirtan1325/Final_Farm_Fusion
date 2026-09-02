import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as THREE from "three";
import { loginUser, registerUser } from "../api/authService";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

const ROLES = [
  {
    id: "farmer",
    label: "Farmer",
    description: "List & sell crops directly",
    icon: "🌾",
  },
  {
    id: "buyer",
    label: "Buyer",
    description: "Source fresh crops directly",
    icon: "🛒",
  },
];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

export default function FarmFusionLogin() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState("login");
  const [role, setRole] = useState("farmer");

  // LOGIN form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // REGISTER form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regFarmName, setRegFarmName] = useState("");
  const [regCompany, setRegCompany] = useState("");
  const [regLocation, setRegLocation] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  // Parse query params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const roleParam = searchParams.get("role");
    if (tabParam === "register" || tabParam === "login") setTab(tabParam);
    if (roleParam === "buyer" || roleParam === "farmer") setRole(roleParam);
  }, [searchParams]);

  const switchTab = (newTab) => {
    setTab(newTab);
    setError("");
    setSuccess(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const data = await loginUser({ email: loginEmail, password: loginPassword });
      login(data.user, data.token);
      setSuccess(true);
      setTimeout(() => {
        if (data.user.role === "admin") navigate("/admin/dashboard");
        else if (data.user.role === "buyer") navigate("/buyer/dashboard");
        else navigate("/farmer/dashboard");
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (regPassword !== regConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role,
        location: regLocation.trim() || undefined,
        ...(role === "farmer"
          ? { farmName: regFarmName.trim() || undefined }
          : { company: regCompany.trim() || undefined }),
      };

      const data = await registerUser(payload);
      login(data.user, data.token);
      setSuccess(true);
      setTimeout(() => {
        if (data.user.role === "buyer") navigate("/buyer/dashboard");
        else navigate("/farmer/dashboard");
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  };

  const BACKEND = import.meta.env.VITE_API_URL || "https://farm-fusion-4.onrender.com";
  const handleGoogle = () => { window.location.href = `${BACKEND}/api/auth/google`; };
  const handleFacebook = () => { window.location.href = `${BACKEND}/api/auth/facebook`; };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Left SaaS Brand Hero Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F4C2A] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl font-bold shadow-md">
              🌱
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Farm Fusion</h1>
              <p className="text-xs text-emerald-200 uppercase tracking-widest font-semibold">AgriTech Platform</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-md my-auto space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight leading-snug">
            Empowering Agriculture with Real-Time Intelligence & Direct Market Access
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Connect directly with buyers, leverage AI crop advisory, track real-time Mandi prices, and optimize soil health in one unified platform.
          </p>

          <div className="space-y-3 pt-4 border-t border-emerald-800/80">
            <div className="flex items-center gap-3 text-xs font-semibold text-emerald-100">
              <span className="w-6 h-6 rounded-full bg-emerald-700/60 flex items-center justify-center text-emerald-300">✓</span>
              AI-Powered Crop & Disease Analytics
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-emerald-100">
              <span className="w-6 h-6 rounded-full bg-emerald-700/60 flex items-center justify-center text-emerald-300">✓</span>
              Direct Farmer-to-Buyer Marketplace
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-emerald-100">
              <span className="w-6 h-6 rounded-full bg-emerald-700/60 flex items-center justify-center text-emerald-300">✓</span>
              Live Mandi Price Ticker & Soil Cards
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-emerald-300/80 font-medium">
          © {new Date().getFullYear()} Farm Fusion Inc. All rights reserved.
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header Brand */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[#0F4C2A] text-white flex items-center justify-center text-lg font-bold">
              🌱
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">Farm Fusion</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">AgriTech Platform</p>
            </div>
          </div>

          {/* Form Card */}
          <Card className="p-6 sm:p-8 shadow-sm">
            {/* Tab Switcher */}
            <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => switchTab("login")}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tab === "login"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchTab("register")}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tab === "register"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Title */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {tab === "login" ? "Welcome back" : "Get started with Farm Fusion"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {tab === "login"
                  ? "Enter your credentials to access your account"
                  : "Select your role and create a new account"}
              </p>
            </div>

            {/* Error / Success Alerts */}
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <span>✅</span>
                <span>Authentication successful! Redirecting...</span>
              </div>
            )}

            {/* Role Selection for Register Tab */}
            {tab === "register" && (
              <div className="mb-5 space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3 text-left rounded-lg border transition-all cursor-pointer ${
                        role === r.id
                          ? "border-[#0F4C2A] bg-emerald-50/50 ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <span className="text-lg block mb-1">{r.icon}</span>
                      <span className="text-xs font-bold text-slate-900 block">{r.label}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">{r.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Forms */}
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Sign In
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
                {role === "farmer" ? (
                  <Input
                    label="Farm Name (Optional)"
                    placeholder="e.g. Green Acres Farm"
                    value={regFarmName}
                    onChange={(e) => setRegFarmName(e.target.value)}
                  />
                ) : (
                  <Input
                    label="Company Name (Optional)"
                    placeholder="e.g. Fresh Market Co."
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                  />
                )}
                <Input
                  label="Location"
                  placeholder="e.g. Gujarat, India"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="Repeat password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full mt-2">
                  Create {role === "farmer" ? "Farmer" : "Buyer"} Account
                </Button>
              </form>
            )}

            {/* Social OAuth Dividers */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Or continue with
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleGoogle}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <GoogleIcon /> Google
              </button>
              <button
                type="button"
                onClick={handleFacebook}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <FacebookIcon /> Facebook
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}