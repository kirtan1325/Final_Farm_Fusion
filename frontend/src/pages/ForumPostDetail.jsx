// frontend/src/pages/ForumPostDetail.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost, addComment, upvotePost, upvoteComment, deleteComment, resolvePost } from "../api/forumService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const getInitials = (name = "") => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });

const CAT_COLORS = {
  general: "ff-badge-gray", disease: "ff-badge-red", weather: "ff-badge-blue",
  market: "ff-badge-green", technique: "ff-badge-green", equipment: "ff-badge-amber", other: "ff-badge-gray",
};

const BackIcon  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>);
const StarIcon  = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const UpIcon    = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>);
const SendIcon  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
const CheckIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const TrashIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>);

export default function ForumPostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  const [post,       setPost]       = useState(null);
  const [comments,   setComments]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const data = await getPost(id);
      setPost(data.data);
      setComments(data.data.comments || []);
    } catch {
      toast.error("Post not found");
      navigate("/forum");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPost(); }, [id]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const data = await addComment(id, { content: newComment });
      setComments(prev => [...prev, data.data]);
      setNewComment("");
      toast.success("Comment added!");
    } catch { toast.error("Failed to add comment"); }
    finally { setSubmitting(false); }
  };

  const handleUpvotePost = async () => {
    try {
      const data = await upvotePost(id);
      setPost(prev => ({ ...prev, upvoteCount: data.upvoteCount }));
    } catch { toast.error("Failed to upvote"); }
  };

  const handleUpvoteComment = async (cid) => {
    try {
      const data = await upvoteComment(cid);
      setComments(prev => prev.map(c => c._id === cid ? { ...c, upvoteCount: data.upvoteCount } : c));
    } catch { toast.error("Failed to upvote"); }
  };

  const handleDeleteComment = async (cid) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(cid);
      setComments(prev => prev.filter(c => c._id !== cid));
      toast.success("Comment deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleResolve = async () => {
    try {
      await resolvePost(id);
      setPost(prev => ({ ...prev, isResolved: true }));
      toast.success("Post marked as resolved!");
    } catch { toast.error("Failed to mark resolved"); }
  };

  if (loading) return (
    <div className="ff-loading-screen" style={{ fontFamily: "var(--ff-font)" }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: "linear-gradient(135deg,#10b981,#059669)", boxShadow: "0 8px 24px rgba(16,185,129,0.4)" }}>
        🌿
      </div>
      <div className="ff-spinner" />
      <p className="text-sm text-gray-400">Loading post...</p>
    </div>
  );

  if (!post) return null;

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--ff-font)", background: "#101415" }}>
      {/* ── Header ── */}
      <header style={{ background: "#0f172a", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        className="sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/forum")}
          className="flex items-center gap-2 text-sm font-medium cursor-pointer transition-colors rounded-xl px-3 py-2"
          style={{ color: "rgba(255,255,255,0.6)" }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
        >
          <BackIcon /> Back to Forum
        </button>
        <div className="w-px h-5 bg-white/10" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">💬</span>
          <span className="font-bold text-white truncate text-sm">Community Forum</span>
        </div>
        <span className="ff-badge ff-badge-green hidden sm:inline-flex">
          {comments.length} {comments.length === 1 ? "reply" : "replies"}
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">

        {/* ── Post Card ── */}
        <div className="ff-card overflow-hidden ff-fade-in">
          {/* Post header stripe */}
          <div className="px-6 pt-6 pb-0 flex items-start gap-4">
            {/* Upvote column */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleUpvotePost}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                style={{ background: "#f0fdf4", border: "1.5px solid #a7f3d0", color: "#10b981" }}
                onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg,#10b981,#059669)"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "transparent"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.color = "#10b981"; e.currentTarget.style.borderColor = "#a7f3d0"; }}
              >
                <UpIcon />
              </button>
              <span className="text-sm font-extrabold text-gray-700">{post.upvoteCount || 0}</span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-6">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {post.isPinned   && <span className="ff-badge ff-badge-amber">📌 Pinned</span>}
                {post.isResolved && <span className="ff-badge ff-badge-green"><CheckIcon /> Resolved</span>}
                <span className={`ff-badge ${CAT_COLORS[post.category] || "ff-badge-gray"} capitalize`}>{post.category}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-3 leading-tight">{post.title}</h1>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm sm:text-base">{post.content}</p>

              {post.imageUrl && (
                <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <img src={post.imageUrl} alt="Post content" className="w-full h-auto max-h-[400px] object-cover"
                    onError={e => { e.target.style.display = "none"; }} />
                </div>
              )}

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-5 pt-4 flex-wrap text-xs text-gray-400"
                style={{ borderTop: "1px solid #f3f4f6" }}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                    {getInitials(post.author?.name)}
                  </div>
                  <span className="font-semibold text-gray-600">{post.author?.name}</span>
                  {post.author?.role === "admin" && (
                    <span className="ff-badge ff-badge-red text-[10px]">Expert</span>
                  )}
                </div>
                <span>{fmtDate(post.createdAt)}</span>
                <span className="flex items-center gap-1">👁 {post.views}</span>
                <span className="flex items-center gap-1">💬 {comments.length}</span>
                {post.author?._id === user?._id && !post.isResolved && (
                  <button onClick={handleResolve}
                    className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl cursor-pointer transition-all"
                    style={{ background: "#f0fdf4", color: "#059669", border: "1px solid #a7f3d0" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#d1fae5"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f0fdf4"; }}>
                    <CheckIcon /> Mark Resolved
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Comments heading ── */}
        <div className="flex items-center justify-between ff-fade-in">
          <h2 className="font-extrabold text-gray-900 text-lg">
            {comments.length} {comments.length === 1 ? "Reply" : "Replies"}
          </h2>
        </div>

        {/* ── Comments ── */}
        <div className="flex flex-col gap-3 ff-fade-in">
          {comments.length === 0 ? (
            <div className="ff-card p-10 text-center text-gray-400">
              <p className="text-4xl mb-3 ff-float">💬</p>
              <p className="font-medium text-gray-500">No replies yet</p>
              <p className="text-sm mt-1">Be the first to share your knowledge!</p>
            </div>
          ) : comments.map((c, i) => (
            <div key={c._id}
              className={`ff-card overflow-hidden ff-fade-in ff-stagger-${Math.min(i + 1, 4)}`}
              style={c.isExpert ? { borderLeft: "4px solid #f59e0b" } : {}}>
              {c.isExpert && (
                <div className="px-5 py-2 flex items-center gap-2 text-xs font-bold"
                  style={{ background: "linear-gradient(135deg,#fef3c7,#fde68a)", color: "#92400e" }}>
                  <StarIcon /> Expert Answer
                </div>
              )}
              <div className="p-5">
                <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{c.content}</p>
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid #f9fafb" }}>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                      {getInitials(c.author?.name)}
                    </div>
                    <span className="font-semibold text-gray-600">{c.author?.name}</span>
                    <span>{fmtDate(c.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleUpvoteComment(c._id)}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-600 cursor-pointer transition-colors font-semibold">
                      <UpIcon /> {c.upvoteCount || 0}
                    </button>
                    {(c.author?._id === user?._id || user?.role === "admin") && (
                      <button onClick={() => handleDeleteComment(c._id)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 cursor-pointer transition-colors">
                        <TrashIcon /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Add Reply ── */}
        <div className="ff-card p-6 ff-fade-in">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              {getInitials(user?.name)}
            </div>
            Add Your Reply
          </h3>
          <form onSubmit={handleComment} className="flex flex-col gap-3">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              rows={4}
              placeholder="Share your knowledge or experience..."
              required
              className="ff-input resize-none"
              style={{ borderRadius: "0.75rem", lineHeight: 1.7 }}
            />
            <div className="flex justify-end">
              <button type="submit" disabled={submitting || !newComment.trim()}
                className="ff-btn ff-btn-primary disabled:opacity-50">
                {submitting
                  ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : <SendIcon />}
                {submitting ? "Posting..." : "Post Reply"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}