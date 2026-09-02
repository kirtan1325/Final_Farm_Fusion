import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import LocationInput from "../components/LocationInput";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

export default function SoilHealthCard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    location: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    phLevel: "",
    organicCarbon: "",
  });

  const fetchTests = async () => {
    try {
      const { data } = await api.get("/soil-health");
      if (data.success) setTests(data.data);
    } catch (err) {
      console.error("Soil tests fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/soil-health", {
        ...formData,
        nitrogen: Number(formData.nitrogen),
        phosphorus: Number(formData.phosphorus),
        potassium: Number(formData.potassium),
        phLevel: Number(formData.phLevel),
        organicCarbon: Number(formData.organicCarbon || 0),
      });
      if (data.success) {
        toast.success("Soil test uploaded & analyzed successfully!");
        setFormData({ location: "", nitrogen: "", phosphorus: "", potassium: "", phLevel: "", organicCarbon: "" });
        fetchTests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit soil test.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      activePath="/farmer/soil-health"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Soil Health Card & Lab Analysis"
      subtitle="Log NPK nutrients and pH test data to calculate soil health scores and fertilizer recommendations."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Soil Test Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Soil Lab Test</CardTitle>
              <CardDescription>Enter N-P-K nutrient readings (kg/ha)</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Location / Field Sector
                  </label>
                  <LocationInput
                    value={formData.location}
                    onChange={(val) => setFormData({ ...formData, location: val })}
                    placeholder="e.g. Field Sector 4, Anand"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Nitrogen (N)"
                    type="number"
                    name="nitrogen"
                    placeholder="280"
                    value={formData.nitrogen}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Phosphorus (P)"
                    type="number"
                    name="phosphorus"
                    placeholder="45"
                    value={formData.phosphorus}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Potassium (K)"
                    type="number"
                    name="potassium"
                    placeholder="180"
                    value={formData.potassium}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="pH Level (0-14)"
                    type="number"
                    step="0.1"
                    name="phLevel"
                    placeholder="6.8"
                    value={formData.phLevel}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Organic Carbon (%)"
                    type="number"
                    step="0.01"
                    name="organicCarbon"
                    placeholder="0.75"
                    value={formData.organicCarbon}
                    onChange={handleChange}
                  />
                </div>

                <Button type="submit" loading={submitting} className="w-full mt-2">
                  🧪 Analyze & Save Card
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Test History List */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Soil Health Digital Cards</CardTitle>
                <CardDescription>Historical soil lab test records and diagnostic scores</CardDescription>
              </div>
              <Badge variant="emerald">Auto-Analyzed</Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              ) : tests.length === 0 ? (
                <EmptyState
                  icon={() => <span className="text-3xl">🌱</span>}
                  title="No soil health cards logged yet"
                  description="Submit your first NPK soil test data on the left to view health scores."
                />
              ) : (
                <div className="space-y-4">
                  {tests.map((t) => {
                    const score = t.healthScore ?? 80;
                    const variant = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
                    return (
                      <div
                        key={t._id}
                        className="p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500 transition-colors space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">
                              {t.location || "Field Plot"}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Tested on {new Date(t.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          <Badge variant={variant}>Score: {score}/100</Badge>
                        </div>

                        <div className="grid grid-cols-5 gap-2 bg-white p-3 rounded-lg border border-slate-200 text-center text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">N</span>
                            <span className="font-extrabold text-slate-800">{t.nitrogen} kg/ha</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">P</span>
                            <span className="font-extrabold text-slate-800">{t.phosphorus} kg/ha</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">K</span>
                            <span className="font-extrabold text-slate-800">{t.potassium} kg/ha</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">pH</span>
                            <span className="font-extrabold text-slate-800">{t.phLevel}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">OC</span>
                            <span className="font-extrabold text-slate-800">{t.organicCarbon || "0"}%</span>
                          </div>
                        </div>

                        {t.recommendations && (
                          <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 space-y-1.5">
                            {typeof t.recommendations === "object" ? (
                              <>
                                {t.recommendations.crops && (Array.isArray(t.recommendations.crops) ? t.recommendations.crops.length > 0 : true) && (
                                  <p>
                                    <strong>Recommended Crops:</strong>{" "}
                                    {Array.isArray(t.recommendations.crops)
                                      ? t.recommendations.crops.join(", ")
                                      : String(t.recommendations.crops)}
                                  </p>
                                )}
                                {t.recommendations.fertilizers && (Array.isArray(t.recommendations.fertilizers) ? t.recommendations.fertilizers.length > 0 : true) && (
                                  <p>
                                    <strong>Fertilizer Plan:</strong>{" "}
                                    {Array.isArray(t.recommendations.fertilizers)
                                      ? t.recommendations.fertilizers.join(", ")
                                      : String(t.recommendations.fertilizers)}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>
                                <strong>Recommendation:</strong> {String(t.recommendations)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
