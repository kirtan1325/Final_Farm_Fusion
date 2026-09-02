import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getWeather, getForecast } from "../api/weatherService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import LocationInput from "../components/LocationInput";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Skeleton from "../components/ui/Skeleton";

const POPULAR_CITIES = ["Ahmedabad", "Mumbai", "Delhi", "Pune", "Surat", "Jaipur", "Lucknow", "Nagpur", "Bhopal", "Indore"];

export default function Weather() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [city, setCity] = useState("Ahmedabad");
  const [input, setInput] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async (c) => {
    setLoading(true);
    try {
      const [w, f] = await Promise.all([getWeather({ city: c }), getForecast({ city: c })]);
      setWeather(w.data);
      setForecast(f.data || []);
      if (w.mock) toast.info("Showing sample weather data.");
    } catch (err) {
      toast.error("City weather not found.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const handleCitySelect = (c) => {
    setCity(c);
    fetchWeather(c);
  };

  return (
    <AppShell
      activePath="/weather"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Agricultural Weather Advisory"
      subtitle="Real-time weather forecast, humidity tracking, and farming weather warnings."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* City Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="w-full sm:w-80">
            <LocationInput
              value={input}
              onChange={(val) => {
                setInput(val);
                setCity(val);
                fetchWeather(val);
              }}
              placeholder="Search region / city..."
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {POPULAR_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => handleCitySelect(c)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  city === c ? "bg-[#0F4C2A] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Current Weather Card */}
        {loading ? (
          <Skeleton className="h-64" />
        ) : weather ? (
          <Card className="bg-gradient-to-br from-[#0F4C2A] to-[#166534] text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <Badge variant="emerald" pulse>
                  Live Region Data
                </Badge>
                <h2 className="text-3xl font-extrabold mt-2">{weather.city || city}</h2>
                <p className="text-sm text-emerald-100/90 capitalize mt-0.5">{weather.description || "Clear Sky"}</p>
                <div className="text-5xl font-black mt-4">{Math.round(weather.temp || 28)}°C</div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-white/10 p-5 rounded-xl border border-white/15 backdrop-blur-xs text-xs">
                <div>
                  <span className="text-emerald-200 block uppercase font-bold text-[10px]">Humidity</span>
                  <span className="text-lg font-bold">{weather.humidity || 65}%</span>
                </div>
                <div>
                  <span className="text-emerald-200 block uppercase font-bold text-[10px]">Wind Speed</span>
                  <span className="text-lg font-bold">{weather.windSpeed || 12} km/h</span>
                </div>
                <div>
                  <span className="text-emerald-200 block uppercase font-bold text-[10px]">Pressure</span>
                  <span className="text-lg font-bold">{weather.pressure || 1012} hPa</span>
                </div>
                <div>
                  <span className="text-emerald-200 block uppercase font-bold text-[10px]">Precipitation</span>
                  <span className="text-lg font-bold">{weather.rain || "0"} mm</span>
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* 5-Day Forecast Grid */}
        <Card>
          <CardHeader>
            <CardTitle>5-Day Agricultural Forecast</CardTitle>
            <CardDescription>Daily temperature & weather projections for field management</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {forecast.slice(0, 5).map((f, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">{f.day || `Day ${i + 1}`}</p>
                    <span className="text-3xl block">⛅</span>
                    <p className="text-base font-extrabold text-slate-900">{Math.round(f.temp || 26)}°C</p>
                    <p className="text-[11px] text-slate-500 capitalize">{f.desc || "Partly Cloudy"}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
