import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getIncomingRequests, acceptRequest, rejectRequest } from "../api/requestService";
import { getRequestStats } from "../api/statsService";
import { useAuth } from "../context/AuthContext";
import NegotiationModal from "../components/NegotiationModal";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Textarea } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const TABS = ["All", "Pending", "Accepted", "Rejected"];

const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

function RejectModal({ isOpen, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Reject Request" subtitle="Optionally inform buyer why request was declined">
      <div className="space-y-4">
        <Textarea
          label="Reason for rejection"
          placeholder="e.g. Out of stock or price mismatch..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => onConfirm(reason)}>
            Confirm Reject
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Requestmanagement() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const [rejectingId, setRejectingId] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [negotiatingReq, setNegotiatingReq] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, statRes] = await Promise.all([getIncomingRequests(), getRequestStats()]);
      setRequests(reqRes.data || []);
      setStats(statRes.data || null);
    } catch (err) {
      console.error("Requests fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (id) => {
    setAcceptingId(id);
    try {
      await acceptRequest(id);
      fetchRequests();
    } catch (err) {
      alert("Failed to accept request.");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectingId) return;
    try {
      await rejectRequest(rejectingId, reason);
      setRejectingId(null);
      fetchRequests();
    } catch (err) {
      alert("Failed to reject request.");
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === "All") return true;
    return req.status?.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <AppShell
      activePath="/farmer/requests"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Incoming Buyer Requests"
      subtitle="Review direct crop purchase offers, accept orders, or negotiate pricing."
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Purchase Offers"
            value={stats?.totalRequests ?? requests.length}
            description="Offers from verified buyers"
          />
          <StatCard
            title="Pending Actions"
            value={stats?.pendingRequests ?? requests.filter((r) => r.status === "pending").length}
            trend="up"
            trendLabel="Action Required"
            description="Needs response"
          />
          <StatCard
            title="Accepted Revenue"
            value={fmt(stats?.acceptedValue || 0)}
            description="Confirmed buyer orders"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === t
                  ? "bg-[#0F4C2A] text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Request Items List */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">📋</span>}
            title="No buyer requests found"
            description="When buyers request produce from your active listings, they will appear here."
          />
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((req) => {
              const statusVariant =
                req.status === "accepted" ? "success" : req.status === "rejected" ? "danger" : "warning";

              return (
                <Card key={req._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 shrink-0">
                        {req.buyerId?.name ? req.buyerId.name.slice(0, 2).toUpperCase() : "BY"}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">{req.buyerId?.name || "Verified Buyer"}</h3>
                          <Badge variant={statusVariant}>{req.status?.toUpperCase() || "PENDING"}</Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Requested <strong>{req.cropId?.name}</strong> • {req.quantity} {req.cropId?.unit || "kg"} • {fmtDate(req.createdAt)}
                        </p>
                        <p className="text-xs font-bold text-[#0F4C2A]">
                          Offer Price: {fmt(req.totalPrice || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      {req.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setNegotiatingReq(req)}
                          >
                            Negotiate
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRejectingId(req._id)}
                          >
                            Decline
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            loading={acceptingId === req._id}
                            onClick={() => handleAccept(req._id)}
                          >
                            Accept Offer
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <RejectModal
        isOpen={Boolean(rejectingId)}
        onCancel={() => setRejectingId(null)}
        onConfirm={handleRejectConfirm}
      />

      {/* Negotiation Modal */}
      {negotiatingReq && (
        <NegotiationModal
          request={negotiatingReq}
          onClose={() => setNegotiatingReq(null)}
          onUpdate={fetchRequests}
        />
      )}
    </AppShell>
  );
}
