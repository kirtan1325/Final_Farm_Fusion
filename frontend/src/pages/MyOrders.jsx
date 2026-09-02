import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyRequests, cancelRequest, payRequest } from "../api/requestService";
import { useAuth } from "../context/AuthContext";
import NegotiationModal from "../components/NegotiationModal";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const FILTER_TABS = ["All", "PENDING", "ACCEPTED", "REJECTED"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function OrderCard({ request, onCancel, onPay, onNegotiate, cancelling, paying }) {
  const isPaid = request.isPaid;

  const statusVariant =
    request.status === "accepted"
      ? "success"
      : request.status === "rejected"
      ? "danger"
      : request.status === "pending"
      ? "warning"
      : "neutral";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
            {request.cropId?.imageUrl ? (
              <img src={request.cropId.imageUrl} alt={request.cropId?.name} className="w-full h-full object-cover" />
            ) : (
              request.cropId?.emoji || "📦"
            )}
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-base">{request.cropId?.name || "Crop Request"}</h3>
              <Badge variant={statusVariant}>{request.status?.toUpperCase() || "PENDING"}</Badge>
              {isPaid && <Badge variant="emerald">PAID</Badge>}
            </div>

            <p className="text-xs text-slate-500">
              Farmer: <strong className="text-slate-700">{request.farmerId?.name || "Regional Farmer"}</strong> • Requested on {fmtDate(request.createdAt)}
            </p>

            <div className="flex items-center gap-4 pt-1 text-xs text-slate-700 font-medium">
              <span>Quantity: <strong>{request.quantity} {request.cropId?.unit || "kg"}</strong></span>
              <span>Total Price: <strong className="text-[#0F4C2A]">{fmt(request.totalPrice || 0)}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          {request.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              loading={cancelling === request._id}
              onClick={() => onCancel(request._id)}
            >
              Cancel Request
            </Button>
          )}

          {request.status === "accepted" && !isPaid && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNegotiate(request)}
              >
                Negotiate
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={paying === request._id}
                onClick={() => onPay(request._id)}
              >
                Pay Now
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyOrders() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [negotiatingRequest, setNegotiatingRequest] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyRequests();
      setRequests(data.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancel = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this purchase request?")) return;
    setCancellingId(id);
    try {
      await cancelRequest(id);
      fetchOrders();
    } catch (err) {
      alert("Failed to cancel request.");
    } finally {
      setCancellingId(null);
    }
  };

  const handlePay = async (id) => {
    setPayingId(id);
    try {
      await payRequest(id);
      fetchOrders();
    } catch (err) {
      alert("Payment failed. Please try again.");
    } finally {
      setPayingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "All") return true;
    return req.status?.toUpperCase() === activeTab;
  });

  return (
    <AppShell
      activePath="/buyer/orders"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="My Purchase Orders"
      subtitle="Track purchase requests, payment status, and price negotiations with farmers."
      headerActions={
        <Button onClick={() => navigate("/marketplace")} size="sm">
          <span>🛒</span> New Order
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#0F4C2A] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">📦</span>}
            title="No purchase orders found"
            description="Browse the marketplace to send direct crop purchase requests to verified farmers."
            actionLabel="Explore Marketplace"
            onAction={() => navigate("/marketplace")}
          />
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => (
              <OrderCard
                key={req._id}
                request={req}
                onCancel={handleCancel}
                onPay={handlePay}
                onNegotiate={(r) => setNegotiatingRequest(r)}
                cancelling={cancellingId}
                paying={payingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Negotiation Modal */}
      {negotiatingRequest && (
        <NegotiationModal
          request={negotiatingRequest}
          onClose={() => setNegotiatingRequest(null)}
          onUpdate={fetchOrders}
        />
      )}
    </AppShell>
  );
}