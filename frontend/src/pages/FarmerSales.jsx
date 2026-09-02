import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFarmerOrders, updateOrderStatus } from "../api/orderService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input, Select } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const STATUS_OPTIONS = ["processing", "shipped", "delivered", "cancelled"];
const FILTER_TABS = ["All", "Processing", "Shipped", "Delivered", "Cancelled"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function FarmerSales() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFarmerOrders();
      if (res.success) setOrders(res.data);
    } catch (err) {
      console.error("Farmer sales error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await updateOrderStatus(orderId, newStatus);
      if (res.success) {
        toast.success(`Order status updated to ${newStatus}!`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      (order.crop?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (order.buyer?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || order.status?.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;

  return (
    <AppShell
      activePath="/farmer/sales"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Sales & Orders Management"
      subtitle="Track incoming buyer orders, delivery fulfillment status, and crop revenue records."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Sales Revenue"
            value={fmt(totalRevenue)}
            trend="up"
            trendLabel="+14%"
            description="Lifetime sales earnings"
          />
          <StatCard
            title="Total Orders"
            value={orders.length}
            description="Total buyer transactions"
          />
          <StatCard
            title="Delivered Orders"
            value={deliveredCount}
            description="Successfully fulfilled"
          />
        </div>

        {/* Orders Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Farmer Sales & Fulfillment</CardTitle>
              <CardDescription>Update shipping and delivery statuses for buyer orders</CardDescription>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Input
                placeholder="Search buyer, crop..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 text-xs py-1.5"
              />
              <div className="flex items-center gap-1.5">
                {FILTER_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      filter === tab
                        ? "bg-[#0F4C2A] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <EmptyState
                icon={() => <span className="text-3xl">💰</span>}
                title="No sales orders found"
                description="When buyers request produce from your listings, orders will appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500 tracking-wider">
                      <th className="px-5 py-3.5">Crop Item</th>
                      <th className="px-5 py-3.5">Buyer</th>
                      <th className="px-5 py-3.5">Quantity</th>
                      <th className="px-5 py-3.5">Total Amount</th>
                      <th className="px-5 py-3.5">Order Status</th>
                      <th className="px-5 py-3.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                          <span>{order.crop?.emoji || "📦"}</span>
                          {order.crop?.name || "Crop"}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {order.buyer?.name || "Verified Buyer"}
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-semibold">
                          {order.quantity} {order.crop?.unit || "kg"}
                        </td>
                        <td className="px-5 py-4 font-bold text-[#0F4C2A]">
                          {fmt(order.totalPrice || 0)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "success"
                                : order.status === "shipped"
                                ? "info"
                                : order.status === "processing"
                                ? "warning"
                                : "neutral"
                            }
                          >
                            {order.status?.toUpperCase() || "PROCESSING"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Select
                            value={order.status || "processing"}
                            disabled={updatingId === order._id}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="w-36 text-xs py-1"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st.charAt(0).toUpperCase() + st.slice(1)}
                              </option>
                            ))}
                          </Select>
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
    </AppShell>
  );
}
