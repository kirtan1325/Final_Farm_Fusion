import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getMyRequests, getIncomingRequests } from "../api/requestService";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Input } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const BACKEND_URL = import.meta.env.VITE_API_URL || "https://final-farm-fusion.onrender.com";

export default function Messages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");

  const endRef = useRef(null);
  const isFarmer = user?.role === "farmer";

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    try {
      let data = [];
      if (isFarmer) {
        const res = await getIncomingRequests({ limit: 50 });
        data = res.data;
      } else {
        const res = await getMyRequests({ limit: 50 });
        data = res.data;
      }
      setRequests(data || []);
      if (data && data.length > 0) {
        setActiveRequest(data[0]);
      }
    } catch (err) {
      console.error("Fetch chats error:", err);
    } finally {
      setLoadingChats(false);
    }
  }, [isFarmer]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const fetchMessages = useCallback(async () => {
    if (!activeRequest) return;
    setLoadingMessages(true);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/api/messages/${activeRequest._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setMessages(data.data || []);
    } catch (err) {
      console.error("Fetch messages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeRequest]);

  useEffect(() => {
    if (activeRequest) fetchMessages();
  }, [activeRequest, fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRequest) return;
    try {
      const recipientId = isFarmer
        ? activeRequest.buyerId?._id || activeRequest.buyer?._id
        : activeRequest.farmerId?._id || activeRequest.farmer?._id;
      const { data } = await axios.post(
        `${BACKEND_URL}/api/messages`,
        { requestId: activeRequest._id, recipientId, text },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setText("");
      }
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const peerName = isFarmer
      ? req.buyerId?.name || req.buyer?.name || "Buyer"
      : req.farmerId?.name || req.farmer?.name || "Farmer";
    const cropName = req.cropId?.name || req.crop?.name || "";
    return (
      peerName.toLowerCase().includes(search.toLowerCase()) ||
      cropName.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <AppShell
      activePath="/messages"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="Direct AgriTech Messaging"
      subtitle="Negotiate prices and coordinate crop deliveries directly with verified partners."
    >
      <Card className="h-[75vh] flex overflow-hidden">
        {/* Left Conversation List */}
        <div className="w-full sm:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3 border-b border-slate-200 bg-white">
            <Input
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs py-1.5"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingChats ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active messaging conversations
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isActive = activeRequest?._id === req._id;
                const peerName = isFarmer
                  ? req.buyerId?.name || req.buyer?.name || "Verified Buyer"
                  : req.farmerId?.name || req.farmer?.name || "Verified Farmer";
                const cropName = req.cropId?.name || req.crop?.name || "Crop Request";

                return (
                  <div
                    key={req._id}
                    onClick={() => setActiveRequest(req)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isActive ? "bg-emerald-50/80 border-l-4 border-l-[#0F4C2A]" : "hover:bg-slate-100/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-xs truncate">{peerName}</h4>
                      <Badge variant="neutral" size="sm">
                        {req.status || "Pending"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      Re: <strong>{cropName}</strong> ({req.quantity || 1} units)
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Messaging Panel */}
        <div className="hidden sm:flex flex-1 flex-col bg-white">
          {activeRequest ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isFarmer
                      ? activeRequest.buyerId?.name || activeRequest.buyer?.name || "Buyer"
                      : activeRequest.farmerId?.name || activeRequest.farmer?.name || "Farmer"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Order Request: {activeRequest.cropId?.name || activeRequest.crop?.name || "Crop"}
                  </p>
                </div>
                <Badge variant="emerald">Direct Encryption</Badge>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8FAFC]">
                {loadingMessages ? (
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-48 ml-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400">
                    No messages yet. Send a greeting to start the conversation!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?._id || m.sender === user?._id;
                    return (
                      <div
                        key={m._id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-xl text-xs ${
                            isMe
                              ? "bg-[#0F4C2A] text-white rounded-br-none"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs"
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Send Bar */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-3">
                <Input
                  placeholder="Type your message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 text-xs py-2"
                />
                <Button type="submit" size="md">
                  Send
                </Button>
              </form>
            </>
          ) : (
            <EmptyState
              icon={() => <span className="text-3xl">💬</span>}
              title="Select a conversation"
              description="Choose a buyer or farmer request on the left to start direct chat."
              className="m-auto border-none shadow-none"
            />
          )}
        </div>
      </Card>
    </AppShell>
  );
}
