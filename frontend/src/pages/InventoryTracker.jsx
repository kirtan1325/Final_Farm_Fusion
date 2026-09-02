import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORIES = ["Seed", "Fertilizer", "Pesticide", "Equipment", "Labor", "Other"];
const UNITS = ["kg", "lb", "liter", "unit", "bag", "hours"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function InventoryTracker() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ totalCost: 0, categoryData: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    category: "Seed",
    itemName: "",
    quantity: "",
    unit: "kg",
    cost: "",
    cropRef: "",
  });

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get("/inventory");
      if (data.success) setExpenses(data.data);
    } catch (err) {
      console.error("Inventory fetch error:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/inventory/stats");
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error("Inventory stats error:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchExpenses(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/inventory", {
        ...formData,
        quantity: Number(formData.quantity),
        cost: Number(formData.cost),
      });

      if (data.success) {
        toast.success("Inventory item added successfully!");
        setFormData({ category: "Seed", itemName: "", quantity: "", unit: "kg", cost: "", cropRef: "" });
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add inventory item.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inventory record?")) return;
    try {
      const { data } = await api.delete(`/inventory/${id}`);
      if (data.success) {
        toast.success("Inventory record deleted.");
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      toast.error("Failed to delete inventory record.");
    }
  };

  const COLORS = ["#0F4C2A", "#10B981", "#84CC16", "#F59E0B", "#EF4444", "#3B82F6"];

  return (
    <AppShell
      activePath="/farmer/inventory"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Farm Inventory & Expense Tracker"
      subtitle="Track seeds, fertilizers, pesticides, equipment, and agricultural operational costs."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Inventory Expenditure"
            value={fmt(stats.totalCost || 0)}
            description="Total seed & chemical input costs"
          />
          <StatCard
            title="Total Logged Items"
            value={expenses.length}
            description="Active stock & expense entries"
          />
          <StatCard
            title="Input Categories"
            value={stats.categoryData?.length || 0}
            description="Operational input types"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Add Item Form */}
          <Card>
            <CardHeader>
              <CardTitle>Log Farm Input / Expense</CardTitle>
              <CardDescription>Track purchase costs for seeds and inputs</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <Select
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Item Name"
                  name="itemName"
                  placeholder="e.g. Hybrid Tomato Seeds"
                  value={formData.itemName}
                  onChange={handleChange}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Quantity"
                    type="number"
                    name="quantity"
                    placeholder="50"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                  />
                  <Select label="Unit" name="unit" value={formData.unit} onChange={handleChange}>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </div>

                <Input
                  label="Total Cost (₹)"
                  type="number"
                  name="cost"
                  placeholder="4500"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                />

                <Button type="submit" loading={submitting} className="w-full mt-2">
                  📦 Log Expense Item
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Expense Table & Distribution Chart */}
          <Card className="lg:col-span-2 space-y-6">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Inventory Log Records</CardTitle>
                <CardDescription>Active stock items and input costs</CardDescription>
              </div>
              <Badge variant="emerald">Auto-Calculated</Badge>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : expenses.length === 0 ? (
                <EmptyState
                  icon={() => <span className="text-3xl">📦</span>}
                  title="No inventory entries logged"
                  description="Add seeds, fertilizers, or labor expenses using the left panel."
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                        <th className="px-5 py-3.5">Item</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Quantity</th>
                        <th className="px-5 py-3.5">Total Cost</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map((exp) => (
                        <tr key={exp._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-4 font-bold text-slate-900">{exp.itemName}</td>
                          <td className="px-5 py-4">
                            <Badge variant="neutral">{exp.category}</Badge>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-semibold">
                            {exp.quantity} {exp.unit}
                          </td>
                          <td className="px-5 py-4 font-bold text-[#0F4C2A]">{fmt(exp.cost)}</td>
                          <td className="px-5 py-4 text-right">
                            <Button variant="danger" size="sm" onClick={() => handleDelete(exp._id)}>
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
