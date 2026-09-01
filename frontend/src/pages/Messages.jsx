import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getMyRequests, getIncomingRequests } from "../api/requestService";
import SharedSidebar from "../components/SharedSidebar";
import SearchAutocomplete from "../components/SearchAutocomplete";

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatListOpen, setChatListOpen] = useState(false);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingChats(false);
    }
  }, [isFarmer]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const fetchMessages = useCallback(async () => {
    if (!activeRequest) return;
    setLoadingMessages(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL || "https://farm-fusion-4.onrender.com"}/api/messages/${activeRequest._id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessages(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  }, [activeRequest]);

  useEffect(() => { if (activeRequest) fetchMessages(); }, [activeRequest, fetchMessages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeRequest) return;
    try {
      const recipientId = isFarmer ? activeRequest.buyer._id : activeRequest.farmer._id;
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || "https://farm-fusion-4.onrender.com"}/api/messages`,
        { requestId: activeRequest._id, recipientId, text },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      if (data.success) { setMessages([...messages, data.data]); setText(""); }
    } catch (err) {
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredRequests = requests.filter(r => {
    const s = search.toLowerCase();
    const otherName = isFarmer ? r.buyer?.name : r.farmer?.name;
    const cropName = r.crop?.name;
    return (otherName || "").toLowerCase().includes(s) || (cropName || "").toLowerCase().includes(s);
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#f8fafc" }}>
      {/* App Sidebar */}
      <SharedSidebar activePath="/messages" open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={() => navigate("/login")} />

      {/* Chat Layout */}
      <div className="flex flex-1 min-w-0 overflow-hidden">

        {/* ── Chat List Panel ── */}
        <div className={`
          fixed inset-y-0 left-0 z-20 w-80 flex flex-col
          transform transition-transform duration-300
          md:relative md:translate-x-0 md:z-auto
          ${chatListOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `} style={{ background: "#062c1d", borderRight: "1px solid rgba(0, 244, 254, 0.2)" }}>
          {/* Header */}
          <div className="p-4" style={{ borderBottom: "1px solid rgba(0, 244, 254, 0.15)" }}>
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-white">Messages</h1>
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white hover:text-[#00f4fe] cursor-pointer p-1">
                <MenuIcon />
              </button>
            </div>
            <div className="z-40">
              <SearchAutocomplete
                value={search}
                onChange={setSearch}
                fetchSuggestions={async (q) => {
                  return requests.filter(r => {
                    const otherName = isFarmer ? r.buyer?.name : r.farmer?.name;
                    return otherName?.toLowerCase().includes(q.toLowerCase());
                  }).map(r => ({ name: isFarmer ? r.buyer?.name : r.farmer?.name }));
                }}
                placeholder="Search chats..."
              />
            </div>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto hidden-scrollbar">
            {loadingChats ? (
              <div className="p-4 flex flex-col gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <div className="ff-shimmer w-11 h-11 rounded-full flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="ff-shimmer h-4 w-3/4 rounded" />
                      <div className="ff-shimmer h-3 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-sm font-medium text-[#a8cfb9]">No conversations yet</p>
                <p className="text-xs text-gray-500 mt-1">Your active crop chats will appear here</p>
              </div>
            ) : (
              filteredRequests.map(r => {
                const isActive = activeRequest?._id === r._id;
                const otherName = isFarmer ? r.buyer?.name : r.farmer?.name;
                return (
                  <button
                    key={r._id}
                    onClick={() => { setActiveRequest(r); setChatListOpen(false); }}
                    className="w-full text-left p-4 transition-colors cursor-pointer flex items-center gap-3"
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      background: isActive ? "rgba(0, 244, 254, 0.15)" : "transparent",
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(0, 244, 254, 0.06)"; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-[0_0_10px_rgba(0,244,254,0.3)]"
                      style={{ background: isActive ? "linear-gradient(135deg,#00f4fe,#4ce346)" : "rgba(0, 244, 254, 0.1)", color: isActive ? "#002021" : "#00f4fe" }}>
                      {r.crop?.emoji || "🌿"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">{otherName}</p>
                        <span className="text-[10px] text-[#a8cfb9] flex-shrink-0 ml-1">
                          {new Date(r.updatedAt || r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#a8cfb9] truncate">Re: {r.crop?.name}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Main Chat Area ── */}
        <div className="flex-1 flex flex-col min-w-0" style={{ background: "#101415" }}>
          {!activeRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <button
                className="md:hidden absolute top-4 left-4 p-2 bg-[#062c1d] rounded-xl text-white border border-[rgba(0,244,254,0.3)] cursor-pointer"
                onClick={() => setChatListOpen(true)}
              >
                <MenuIcon />
              </button>
              <div className="text-6xl mb-4 opacity-60">💬</div>
              <h2 className="text-xl font-bold text-white mb-2">Direct Farmer Chat</h2>
              <p className="text-[#a8cfb9] text-sm max-w-xs">Select a conversation from the chat list to manage offers & negotiation</p>
              <button
                className="mt-4 md:hidden ff-btn ff-btn-primary"
                onClick={() => setChatListOpen(true)}
              >
                Open Conversations
              </button>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3.5 flex items-center gap-3 sticky top-0 z-10"
                style={{ background: "#062c1d", borderBottom: "1px solid rgba(0,244,254,0.2)" }}>
                <button className="md:hidden text-white p-1 cursor-pointer" onClick={() => setChatListOpen(true)}>
                  <BackIcon />
                </button>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-[0_0_10px_rgba(0,244,254,0.3)]"
                  style={{ background: "linear-gradient(135deg,#00f4fe,#4ce346)", color: "#002021" }}>
                  {activeRequest.crop?.emoji || "🌿"}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-white">
                    {isFarmer ? activeRequest.buyer?.name : activeRequest.farmer?.name}
                  </h2>
                  <p className="text-xs text-[#a8cfb9]">
                    Regarding: {activeRequest.crop?.name} · {activeRequest.quantity} {activeRequest.unit}
                  </p>
                </div>
                <span className={`ff-badge ${activeRequest.status === "accepted" ? "ff-badge-green" : activeRequest.status === "rejected" ? "ff-badge-red" : "ff-badge-amber"}`}>
                  {activeRequest.status}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto flex flex-col gap-3">
                {loadingMessages ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div className={`ff-shimmer h-12 rounded-2xl ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="m-auto flex flex-col items-center text-[#a8cfb9]">
                    <span className="text-4xl mb-3">👋</span>
                    <p className="text-sm font-medium text-white">No messages yet. Send a greeting to start!</p>
                  </div>
                ) : (
                  messages.map((m, i) => {
                    const isMine = m.sender._id === user._id;
                    return (
                      <div key={i} className={`flex flex-col max-w-[70%] sm:max-w-[60%] ff-fade-in ${isMine ? "self-end items-end" : "self-start items-start"}`}>
                        <span className="text-[10px] text-[#a8cfb9] mb-1 px-1">{m.sender.name}</span>
                        <div className={`px-4 py-3 text-sm leading-relaxed rounded-2xl ${
                          isMine
                            ? "bg-[#00f4fe] text-[#002021] font-medium shadow-[0_0_15px_rgba(0,244,254,0.2)]"
                            : "bg-[#062c1d] border border-[rgba(0,244,254,0.2)] text-white"
                        }`}>
                          {m.isBidOffer && (
                            <div className="text-xs font-bold uppercase tracking-wider mb-1.5 opacity-90 border-b border-current pb-1.5">
                              💰 Bid Offer
                            </div>
                          )}
                          <p>{m.text}</p>
                          {m.isBidOffer && <p className="font-bold mt-1.5 text-base">₹{m.proposedPrice}</p>}
                        </div>
                        <span className="text-[10px] text-[#a8cfb9] mt-1 px-1">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[rgba(0,244,254,0.2)]" style={{ background: "#062c1d" }}>
                <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
                  <div className="ff-input-group flex-1">
                    <input
                      type="text"
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Type a message..."
                      className="text-white placeholder-[#8b928d]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="ff-btn ff-btn-primary w-11 h-11 p-0 rounded-full flex items-center justify-center flex-shrink-0"
                  >
                    <SendIcon />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {chatListOpen && (
        <div className="fixed inset-0 bg-black/30 z-10 md:hidden backdrop-blur-sm" onClick={() => setChatListOpen(false)} />
      )}
    </div>
  );
}
