import { useState, useEffect } from "react";
import api from "../api/axiosInstance";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PlusCircle, Trash2, ArrowLeft, Menu, PackageOpen } from "lucide-react";
import SharedSidebar from "../components/SharedSidebar";

export default function InventoryTracker() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ totalCost: 0, categoryData: [] });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toast = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    category: "Seed",
    itemName: "",
    quantity: "",
    unit: "kg",
    cost: "",
    cropRef: ""
  });

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get("/inventory");
      if (data.success) setExpenses(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/inventory/stats");
      if (data.success) setStats(data.data);
    } catch (err) {
      console.error(err);
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
    try {
      const { data } = await api.post("/inventory", {
        ...formData,
        quantity: Number(formData.quantity),
        cost: Number(formData.cost)
      });

      if (data.success) {
        toast.success("Expense added successfully!");
        setFormData({ ...formData, itemName: "", quantity: "", cost: "", cropRef: "" });
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add expense");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      const { data } = await api.delete(`/inventory/${id}`);
      if (data.success) {
        toast.success("Expense deleted");
        fetchExpenses();
        fetchStats();
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280"];

  // ── Shimmer Loading ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#101415" }}>
        <SharedSidebar activePath="/farmer/inventory" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Topbar skeleton */}
          <header className="ff-topbar">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors mr-2 cursor-pointer">
              <Menu size={22} />
            </button>
            <div className="ff-shimmer h-6 w-48 rounded-lg" />
          </header>
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <div className="ff-shimmer h-10 w-72 rounded-xl mb-2" />
            <div className="ff-shimmer h-5 w-48 rounded-lg mb-8" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="ff-shimmer h-96 rounded-2xl" />
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="ff-shimmer h-64 rounded-2xl" />
                  <div className="ff-shimmer h-64 rounded-2xl" />
                </div>
                <div className="ff-shimmer h-72 rounded-2xl" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#101415" }}>
      <SharedSidebar activePath="/farmer/inventory" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* ── Topbar ── */}
        <header className="ff-topbar">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-white hover:text-[#00f4fe] transition-colors mr-2 cursor-pointer"
          >
            <Menu size={22} />
          </button>
          <Link
            to="/farmer/dashboard"
            className="flex items-center gap-1.5 text-[#a8cfb9] hover:text-[#00f4fe] transition-colors mr-3 text-xs font-bold uppercase tracking-wider"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(0,244,254,0.3)]"
              style={{ background: "linear-gradient(135deg,#00f4fe,#4ce346)" }}>
              <PackageOpen size={14} className="text-[#002021]" />
            </div>
            <span className="font-bold text-white text-base">Inventory & Expenses</span>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">

          {/* Page heading */}
          <div className="mb-8 ff-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 ff-gradient-text">
              Smart Inventory Tracker
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track and analyze your farming expenses in real-time</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

            {/* ── Add Expense Form ── */}
            <div className="ff-card p-6 ff-fade-in ff-stagger-1">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                  <PlusCircle size={16} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Add Expense</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="ff-input"
                  >
                    <option>Seed</option>
                    <option>Fertilizer</option>
                    <option>Pesticide</option>
                    <option>Labor</option>
                    <option>Equipment</option>
                    <option>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</label>
                  <input
                    required
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleChange}
                    placeholder="e.g. Urea 46%, Tractor Rent"
                    className="ff-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</label>
                    <input
                      required
                      type="number"
                      min="0.1"
                      step="0.1"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="ff-input"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unit</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="ff-input"
                    >
                      <option>kg</option>
                      <option>liters</option>
                      <option>bags</option>
                      <option>hours</option>
                      <option>days</option>
                      <option>units</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cost (₹)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    placeholder="5000"
                    className="ff-input"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Crop <span className="normal-case font-normal text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="cropRef"
                    value={formData.cropRef}
                    onChange={handleChange}
                    placeholder="e.g. Kharif Cotton 2024"
                    className="ff-input"
                  />
                </div>

                <button type="submit" className="ff-btn ff-btn-primary w-full flex items-center justify-center gap-2 mt-2">
                  <PlusCircle size={18} />
                  Add Expense
                </button>
              </form>
            </div>

            {/* ── Analytics & List ── */}
            <div className="space-y-6 lg:col-span-2">

              {/* Charts Row */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                {/* Pie Chart Card */}
                <div className="ff-card p-6 ff-fade-in ff-stagger-2">
                  <h3 className="text-base font-bold text-gray-800 mb-1">Expense Breakdown</h3>
                  <p className="text-xs text-gray-400 mb-4">Spending distribution by category</p>
                  <div className="h-56">
                    {stats.categoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {stats.categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                          <Legend iconType="circle" iconSize={8} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <span className="text-4xl opacity-40">📊</span>
                        <p className="text-sm text-gray-400">No data yet — add your first expense</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Expenses Card */}
                <div
                  className="flex flex-col justify-center p-6 text-center text-white rounded-2xl shadow-lg ff-fade-in ff-stagger-2"
                  style={{
                    background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                    boxShadow: "0 8px 32px rgba(16,185,129,0.35)"
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(255,255,255,0.15)" }}>
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ opacity: 0.85 }}>
                    Total Expenses
                  </h3>
                  <p className="mt-3 font-extrabold text-5xl tracking-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.15)" }}>
                    ₹{stats.totalCost.toLocaleString()}
                  </p>
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                    <p className="text-xs leading-relaxed" style={{ opacity: 0.75 }}>
                      Track costs effectively to maximize profits when selling crops.
                    </p>
                  </div>
                  {expenses.length > 0 && (
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white opacity-60" />
                      <span className="text-xs font-medium" style={{ opacity: 0.7 }}>
                        {expenses.length} expense{expenses.length !== 1 ? "s" : ""} recorded
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Expenses Table ── */}
              <div className="ff-card overflow-hidden ff-fade-in ff-stagger-3">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">Recent Expenses</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{expenses.length} total records</p>
                  </div>
                </div>

                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <span className="text-5xl opacity-40">📦</span>
                    <p className="font-semibold text-gray-500">No expenses recorded yet</p>
                    <p className="text-sm text-gray-400">Use the form to add your first inventory expense</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="ff-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Item &amp; Category</th>
                          <th>Quantity</th>
                          <th>Cost</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((exp) => (
                          <tr key={exp._id}>
                            <td>
                              <span className="text-gray-500 text-xs">
                                {new Date(exp.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </td>
                            <td>
                              <p className="font-semibold text-gray-800 text-sm">{exp.itemName}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                <span className="ff-badge ff-badge-green" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                                  {exp.category}
                                </span>
                                {exp.cropRef && <span className="ml-1 text-gray-400">• {exp.cropRef}</span>}
                              </p>
                            </td>
                            <td>
                              <span className="text-gray-700 font-medium text-sm">{exp.quantity} {exp.unit}</span>
                            </td>
                            <td>
                              <span className="font-bold text-red-600 text-sm">₹{exp.cost.toLocaleString()}</span>
                            </td>
                            <td className="text-right">
                              <button
                                onClick={() => handleDelete(exp._id)}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 transition-all duration-150 cursor-pointer"
                                title="Delete expense"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
