// frontend/src/pages/Weather.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWeather, getForecast } from "../api/weatherService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SharedSidebar from "../components/SharedSidebar";
import LocationInput from "../components/LocationInput";

const MenuIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const SearchIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const WEATHER_ICONS = {
  "01d": "☀️", "01n": "🌙", "02d": "⛅", "02n": "⛅",
  "03d": "☁️", "03n": "☁️", "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️", "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️", "13d": "❄️", "13n": "❄️",
  "50d": "🌫️", "50n": "🌫️",
};

const POPULAR_CITIES = ["Ahmedabad", "Mumbai", "Delhi", "Pune", "Surat", "Jaipur", "Lucknow", "Nagpur", "Bhopal", "Indore"];

export default function Weather() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const toast     = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [city,    setCity]    = useState("Ahmedabad");
  const [input,   setInput]   = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast,setForecast]= useState([]);
  const [loading, setLoading] = useState(true);

  const dashPath = user?.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";

  const fetchWeather = async (c) => {
    setLoading(true);
    try {
      const [w, f] = await Promise.all([getWeather({ city: c }), getForecast({ city: c })]);
      setWeather(w.data);
      setForecast(f.data || []);
      if (w.mock) toast.info("Showing sample weather — add WEATHER_API_KEY to .env for real data");
    } catch (err) {
      toast.error(err.response?.data?.message || "City not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWeather(city); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setCity(input.trim());
    fetchWeather(input.trim());
    setInput("");
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const FARM_ADVICE = (temp, desc) => {
    const d = desc?.toLowerCase() || "";
    if (d.includes("rain") || d.includes("drizzle")) return { icon: "🌧️", msg: "Heavy Rain Alert! Delay irrigation by 2 days. Avoid spraying pesticides today as rain will wash them off.", color: "bg-blue-50 border-blue-300 text-blue-800", isAlert: true };
    if (d.includes("storm") || d.includes("thunder"))  return { icon: "⛈️", msg: "Storm Alert! Stay safe — avoid field work and secure equipment.", color: "bg-red-50 border-red-300 text-red-800", isAlert: true };
    if (temp > 38)  return { icon: "🌡️", msg: "Heatwave Alert! Very hot. Irrigate crops in early morning or evening to prevent water stress.", color: "bg-orange-50 border-orange-300 text-orange-800", isAlert: true };
    if (temp < 10)  return { icon: "❄️", msg: "Frost Alert! Cold wave expected. Protect sensitive crops with mulching or light evening irrigation.", color: "bg-indigo-50 border-indigo-300 text-indigo-800", isAlert: true };
    return { icon: "✅", msg: "Good weather for field work and crop spraying today. Maintain standard irrigation schedule.", color: "bg-green-50 border-green-300 text-green-800", isAlert: false };
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#f8fafc" }}>
      <SharedSidebar activePath="/weather" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Topbar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden cursor-pointer text-gray-500 hover:text-gray-800 transition-colors">
            <MenuIcon />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xl">🌦️</span>
            <span className="font-bold text-gray-900">Weather Information</span>
          </div>
          {/* Search bar */}
          <div className="hidden sm:flex items-center w-64 z-50">
            <LocationInput
              value={input}
              onChange={(val) => {
                setInput(val);
                setCity(val);
                fetchWeather(val);
              }}
              placeholder="Search city..."
            />
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6 max-w-5xl w-full mx-auto">

          {/* Page heading */}
          <div className="ff-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Weather for Farmers
            </h1>
            <p className="text-sm text-gray-500 mt-1">Location-based weather to plan your farming activities.</p>
          </div>

          {/* Mobile search */}
          <div className="sm:hidden flex items-center w-full z-40">
            <LocationInput
              value={input}
              onChange={(val) => {
                setInput(val);
                setCity(val);
                fetchWeather(val);
              }}
              placeholder="Search city..."
            />
          </div>

          {/* Popular cities */}
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.map(c => (
              <button
                key={c}
                onClick={() => { setCity(c); fetchWeather(c); }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-sm"
                style={city === c
                  ? { background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(59,130,246,0.35)" }
                  : { background: "#fff", color: "#6b7280", borderColor: "#d1d5db" }
                }
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            /* Shimmer skeleton cards */
            <div className="flex flex-col gap-4">
              {/* Main card shimmer */}
              <div className="ff-shimmer rounded-2xl h-52 w-full" />
              {/* Advice banner shimmer */}
              <div className="ff-shimmer rounded-xl h-16 w-full" />
              {/* Forecast shimmer */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="ff-shimmer rounded-xl h-36" />
                ))}
              </div>
            </div>
          ) : weather ? (
            <>
              {/* Main weather card */}
              <div
                className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-2xl ff-fade-in"
                style={{ position: "relative", overflow: "hidden" }}
              >
                {/* Decorative blur circle */}
                <div style={{
                  position: "absolute", top: "-40px", right: "-40px",
                  width: "180px", height: "180px",
                  background: "rgba(255,255,255,0.07)",
                  borderRadius: "50%",
                  filter: "blur(30px)",
                  pointerEvents: "none"
                }} />

                <div className="flex items-start justify-between gap-4 flex-wrap relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-blue-200 text-sm font-medium uppercase tracking-widest">Current Weather</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                      {weather.city}, {weather.country}
                    </h2>
                    <p className="text-blue-200 text-sm mt-1 capitalize font-medium">{weather.description}</p>
                    <div className="flex items-end gap-3 mt-5">
                      <span className="text-7xl sm:text-8xl font-black leading-none">{weather.temp}°</span>
                      <span className="text-blue-200 text-lg mb-3 font-medium">Feels like {weather.feelsLike}°C</span>
                    </div>
                  </div>
                  <span className="text-8xl sm:text-9xl select-none drop-shadow-lg">{WEATHER_ICONS[weather.icon] || "🌡️"}</span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-7 pt-5 border-t border-white/20 relative z-10">
                  {[
                    { label: "Humidity",   value: `${weather.humidity}%`,      icon: "💧" },
                    { label: "Wind Speed", value: `${weather.windSpeed} m/s`,   icon: "💨" },
                    { label: "Sunrise",    value: weather.sunrise,             icon: "🌅" },
                    { label: "Sunset",     value: weather.sunset,              icon: "🌇" },
                  ].map(s => (
                    <div
                      key={s.label}
                      className="rounded-xl p-3 text-center transition-all"
                      style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
                    >
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-sm font-bold">{s.value}</div>
                      <div className="text-xs text-blue-200 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Farm advice banner */}
              {(() => {
                const advice = FARM_ADVICE(weather.temp, weather.description);
                return (
                  <div
                    className={`flex items-start sm:items-center gap-4 px-5 py-4 rounded-xl border text-sm font-medium ${advice.color} border-l-4 shadow-sm transition-all ff-fade-in ff-stagger-1`}
                    style={{ borderLeftWidth: "4px" }}
                  >
                    <span className="text-3xl flex-shrink-0">{advice.icon}</span>
                    <div>
                      <p className={`font-bold mb-1 uppercase tracking-wider text-xs ${advice.isAlert ? "" : "opacity-70"}`}>
                        {advice.isAlert ? "🚨 Critical Alert" : "Today's Farming Advice"}
                      </p>
                      <p className={advice.isAlert ? "text-base font-semibold" : ""}>{advice.msg}</p>
                    </div>
                  </div>
                );
              })()}

              {/* 5-day forecast */}
              {forecast.length > 0 && (
                <div className="ff-fade-in ff-stagger-2">
                  <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <span>📅</span> 5-Day Forecast
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {forecast.map((f, i) => (
                      <div key={i} className="ff-card ff-card-hover p-4 text-center">
                        <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
                          {f.time?.split(" ")[0] || `Day ${i + 1}`}
                        </p>
                        <div className="text-4xl my-3">{WEATHER_ICONS[f.icon] || "🌡️"}</div>
                        <p className="font-extrabold text-xl text-gray-900">{f.temp}°C</p>
                        <p className="text-xs text-gray-400 capitalize mt-1 leading-snug">{f.description}</p>
                        <div className="mt-2 inline-flex items-center gap-1 bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 text-xs font-semibold">
                          💧 {f.humidity}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
