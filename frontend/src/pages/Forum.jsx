// frontend/src/pages/Forum.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPosts, createPost, upvotePost, deletePost } from "../api/forumService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import SharedSidebar from "../components/SharedSidebar";
import SearchAutocomplete from "../components/SearchAutocomplete";

const MenuIcon   = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const PlusIcon   = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
const SearchIcon = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

const CATEGORIES = ["All","general","disease","weather","market","technique","equipment","other"];
const CAT_BADGE_COLORS = {
  general:   "ff-badge ff-badge-gray",
  disease:   "ff-badge ff-badge-red",
  weather:   "ff-badge ff-badge-blue",
  market:    "ff-badge ff-badge-green",
  technique: "ff-badge",
  equipment: "ff-badge ff-badge-amber",
  other:     "ff-badge ff-badge-gray",
};
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });

export default function Forum() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [posts,     setPosts]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("All");
  const [page,      setPage]      = useState(1);
  const [totalPages,setTotalPages]= useState(1);
  const [showNew,   setShowNew]   = useState(false);

  // New post form
  const [newTitle,   setNewTitle]   = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCat,     setNewCat]     = useState("general");
  const [newImage,   setNewImage]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dashPath = user?.role === "farmer" ? "/farmer/dashboard" : "/buyer/dashboard";

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (category !== "All") params.category = category;
      if (search.trim())      params.search    = search.trim();
      const data = await getPosts(params);
      setPosts(data.data || []);
      setTotalPages(data.pages || 1);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(fetchPosts, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [category, search, page]);

  const handleUpvote = async (id) => {
    try {
      const res = await upvotePost(id);
      setPosts(prev => prev.map(p => p._id === id ? { ...p, upvoteCount: res.upvoteCount } : p));
    } catch { toast.error("Failed to upvote"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      setPosts(prev => prev.filter(p => p._id !== id));
      toast.success("Post deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) { toast.error("Title and content are required"); return; }
    setSubmitting(true);
    try {
      const data = await createPost({ title: newTitle, content: newContent, category: newCat, imageUrl: newImage.trim() });
      setPosts(prev => [data.data, ...prev]);
      setNewTitle(""); setNewContent(""); setNewCat("general"); setNewImage("");
      setShowNew(false);
      toast.success("Post published!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post");
    } finally { setSubmitting(false); }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "var(--ff-font)", background: "#f8fafc" }}>
      <SharedSidebar open={sidebarOpen} setOpen={setSidebarOpen} user={user} onLogout={handleLogout} activePath="/forum" />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* Topbar */}
        <header className="ff-topbar">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden cursor-pointer text-gray-500 hover:text-gray-800 transition-colors">
            <MenuIcon />
          </button>
          <span className="text-xl">💬</span>
          <span className="font-bold text-gray-900 flex-1">Community Forum</span>
          <button
            onClick={() => setShowNew(true)}
            className="ff-btn ff-btn-primary flex items-center gap-2"
          >
            <PlusIcon /> Ask Question
          </button>
        </header>

        {/* New post modal */}
        {showNew && (
          <div className="ff-modal-overlay">
            <div className="ff-modal ff-scale-in w-full max-w-xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Ask the Community</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Share your question with fellow farmers</p>
                </div>
                <button
                  onClick={() => setShowNew(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-all text-xl leading-none"
                >
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmitPost} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    className="ff-input cursor-pointer"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(c => (
                      <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Title *</label>
                  <input
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Why are my tomato leaves yellowing?"
                    required
                    className="ff-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Description *</label>
                  <textarea
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    rows={4}
                    placeholder="Describe your question in detail..."
                    required
                    className="ff-input resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Image URL (Optional)</label>
                  <input
                    value={newImage}
                    onChange={e => setNewImage(e.target.value)}
                    placeholder="https://example.com/leaf-disease.jpg"
                    type="url"
                    className="ff-input"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNew(false)}
                    className="ff-btn ff-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ff-btn ff-btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                    ) : null}
                    {submitting ? "Posting..." : "Post Question"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 max-w-4xl w-full mx-auto">

          {/* Page heading */}
          <div className="ff-fade-in">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Community Forum</h1>
            <p className="text-sm text-gray-500 mt-1">Ask questions, share knowledge, help each other grow.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 max-w-sm z-40">
              <SearchAutocomplete
                value={search}
                onChange={setSearch}
                fetchSuggestions={async (q) => {
                  return posts.filter(p => p.title.toLowerCase().includes(q.toLowerCase()));
                }}
                renderItem={(item) => item.title}
                placeholder="Search posts..."
              />
            </div>
            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => { setCategory(c); setPage(1); }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer capitalize transition-all shadow-sm"
                  style={category === c
                    ? { background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(16,185,129,0.35)" }
                    : { background: "#fff", color: "#6b7280", borderColor: "#d1d5db" }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Loading shimmer */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="ff-card p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="ff-shimmer h-4 w-24 rounded-full" />
                      <div className="ff-shimmer h-5 w-3/4 rounded-lg" />
                      <div className="ff-shimmer h-4 w-full rounded-lg" />
                      <div className="ff-shimmer h-4 w-2/3 rounded-lg" />
                      <div className="flex gap-3">
                        <div className="ff-shimmer h-3 w-20 rounded-full" />
                        <div className="ff-shimmer h-3 w-14 rounded-full" />
                        <div className="ff-shimmer h-3 w-10 rounded-full" />
                      </div>
                    </div>
                    <div className="ff-shimmer w-9 h-9 rounded-full flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty state */
            <div className="text-center py-24 text-gray-400 ff-fade-in">
              <div className="text-6xl mb-4" style={{ animation: "ff-float 3s ease-in-out infinite" }}>💬</div>
              <p className="font-bold text-gray-600 text-lg mb-1">No posts yet</p>
              <p className="text-sm text-gray-400 mb-6">Be the first to start a conversation!</p>
              <button
                onClick={() => setShowNew(true)}
                className="ff-btn ff-btn-primary"
              >
                Ask the First Question
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((p, idx) => (
                <div
                  key={p._id}
                  className="ff-card ff-card-hover p-5 cursor-pointer"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                  onClick={() => navigate(`/forum/${p._id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {p.isPinned && (
                          <span className="ff-badge ff-badge-amber">📌 Pinned</span>
                        )}
                        {p.isResolved && (
                          <span className="ff-badge ff-badge-green">✅ Resolved</span>
                        )}
                        <span className={CAT_BADGE_COLORS[p.category] || "ff-badge ff-badge-gray"} style={{ textTransform: "capitalize" }}>
                          {p.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-gray-900 text-base leading-tight hover:text-emerald-700 transition-colors">
                        {p.title}
                      </h3>

                      {/* Content preview */}
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.content}</p>

                      {/* Image indicator */}
                      {p.imageUrl && (
                        <div className="mt-2 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                          Contains Image
                        </div>
                      )}

                      {/* Author & meta */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {/* Author avatar */}
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                          >
                            {getInitials(p.author?.name)}
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{p.author?.name}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${p.author?.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>
                            {p.author?.role}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{fmtDate(p.createdAt)}</span>
                        {/* Views & comments pills */}
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                          👁 {p.views}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">
                          💬 {p.commentCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Upvote button */}
                    <div
                      className="flex flex-col items-center gap-1 flex-shrink-0"
                      onClick={e => { e.stopPropagation(); handleUpvote(p._id); }}
                    >
                      <button
                        className="w-9 h-9 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 transition-all cursor-pointer text-sm font-bold shadow-sm"
                      >
                        ▲
                      </button>
                      <span className="text-xs font-bold text-gray-600">{p.upvoteCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 cursor-pointer transition-all text-base font-bold"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className="w-9 h-9 rounded-full text-sm font-semibold cursor-pointer transition-all border"
                  style={page === pg
                    ? { background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(16,185,129,0.35)" }
                    : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
                  }
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-30 cursor-pointer transition-all text-base font-bold"
              >
                ›
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
