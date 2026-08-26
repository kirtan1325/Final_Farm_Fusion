import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function NegotiationModal({ request, onClose, isFarmer }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isBid, setIsBid] = useState(false);
  const [proposedPrice, setProposedPrice] = useState(request?.totalPrice || "");
  const [loading, setLoading] = useState(true);
  
  const endRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || "https://farm-fusion-4.onrender.com"}/api/messages/${request._id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMessages(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (request?._id) fetchMessages();
  }, [request]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !isBid) return;

    try {
      const recipientId = isFarmer ? request.buyer._id : request.farmer._id;
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || "https://farm-fusion-4.onrender.com"}/api/messages`, {
        requestId: request._id,
        recipientId,
        text: text || `Proposed new price: $${proposedPrice}`,
        isBidOffer: isBid,
        proposedPrice: isBid ? Number(proposedPrice) : undefined
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });

      if (data.success) {
        setMessages([...messages, data.data]);
        setText("");
        setIsBid(false);
        // Optional: Trigger a parent refresh if bid was accepted
      }
    } catch (err) {
      alert("Failed to send message: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col h-[600px] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-green-50">
          <div>
            <h3 className="font-bold text-green-900 flex items-center gap-2">
              <span>💬</span> Negotiation: {request.crop?.name}
            </h3>
            <p className="text-xs text-green-700 mt-1">
              Current Price: <strong>${request.totalPrice}</strong> | Qty: {request.quantity} {request.unit}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer text-2xl leading-none">&times;</button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
          {loading ? (
            <div className="m-auto text-gray-400">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="m-auto text-sm text-gray-400 text-center">
              <span className="text-3xl block mb-2">👋</span>
              No messages yet.<br/>Start the negotiation!
            </div>
          ) : (
            messages.map((m, i) => {
              const isMine = m.sender._id === user._id;
              return (
                <div key={i} className={`flex flex-col max-w-[80%] ${isMine ? "self-end items-end" : "self-start items-start"}`}>
                  <span className="text-[10px] text-gray-400 mb-0.5 px-1">{m.sender.name}</span>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-green-600 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"} ${m.isBidOffer ? "ring-2 ring-amber-400 shadow-md" : ""}`}>
                    {m.isBidOffer && <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-80 border-b border-current pb-1">💰 New Bid Offer</div>}
                    <p>{m.text}</p>
                    {m.isBidOffer && <p className="font-bold mt-1 text-base">${m.proposedPrice}</p>}
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex flex-col gap-3">
            {isBid && (
              <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-lg border border-amber-200">
                <span className="text-sm font-semibold text-amber-800">New Price ($):</span>
                <input type="number" required value={proposedPrice} onChange={e => setProposedPrice(e.target.value)}
                  className="w-24 p-1 rounded border border-amber-300 outline-none focus:border-amber-500 text-sm font-bold text-amber-900" />
                <button type="button" onClick={() => setIsBid(false)} className="text-xs text-gray-500 hover:text-red-500 ml-auto cursor-pointer">Cancel Bid</button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsBid(!isBid)} className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${isBid ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`} title="Make an Offer">
                💰
              </button>
              <input type="text" value={text} onChange={e => setText(e.target.value)} placeholder={isBid ? "Add an optional note..." : "Type a message..."}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:bg-white transition-all" />
              <button type="submit" disabled={!text.trim() && !isBid} className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer">
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
