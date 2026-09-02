import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getPosts, createPost, upvotePost, deletePost } from "../api/forumService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { Input, Select, Textarea } from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";

const CATEGORIES = ["All", "general", "disease", "weather", "market", "technique", "equipment", "other"];
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function NewPostModal({ isOpen, onClose, onCreated }) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await createPost({ title, content, category });
      onCreated(data.data);
      setTitle("");
      setContent("");
      onClose();
      toast.success("Discussion post published!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to publish post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start Community Discussion" subtitle="Ask a question or share farming insights with the community">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Post Title"
          placeholder="e.g. Best organic remedies for Tomato Blight?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Select label="Topic Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.filter((c) => c !== "All").map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </Select>

        <Textarea
          label="Discussion Content"
          placeholder="Share field details, questions, or crop experiences..."
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Publish Post
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Forum() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = { limit: 20 };
      if (category !== "All") params.category = category;
      if (search.trim()) params.search = search.trim();
      const data = await getPosts(params);
      setPosts(data.data || []);
    } catch (err) {
      console.error("Forum fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchPosts, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [category, search]);

  const handleUpvote = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await upvotePost(id);
      setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, upvoteCount: res.upvoteCount } : p)));
    } catch (err) {
      toast.error("Failed to upvote.");
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this discussion post?")) return;
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Post deleted.");
    } catch (err) {
      toast.error("Failed to delete post.");
    }
  };

  return (
    <AppShell
      activePath="/forum"
      user={user}
      onLogout={() => {
        logout();
        navigate("/login");
      }}
      title="AgriTech Community Forum"
      subtitle="Knowledge exchange, peer-to-peer crop discussions, and expert advice."
      headerActions={
        <Button onClick={() => setModalOpen(true)} size="sm">
          <span>+</span> New Post
        </Button>
      }
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Search & Category Filter */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Input
            placeholder="Search discussions, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-80"
          />

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  category === c
                    ? "bg-[#0F4C2A] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={() => <span className="text-3xl">🗣</span>}
            title="No discussion posts found"
            description="Be the first to start a conversation with fellow farmers and buyers!"
            actionLabel="+ Start Discussion"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Card
                key={post._id}
                onClick={() => navigate(`/forum/${post._id}`)}
                className="hover:shadow-md transition-all cursor-pointer"
              >
                <CardContent className="p-5 flex items-start justify-between gap-5">
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="emerald">{post.category || "General"}</Badge>
                      <span className="text-xs text-slate-400 font-medium">
                        Posted by <strong>{post.author?.name || "Community Member"}</strong> • {fmtDate(post.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug">{post.title}</h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{post.content}</p>

                    <div className="flex items-center gap-4 pt-2 text-xs font-semibold text-slate-500">
                      <span>💬 {post.commentCount || post.comments?.length || 0} Replies</span>
                      <span>▲ {post.upvoteCount || 0} Upvotes</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleUpvote(post._id, e)}
                    >
                      ▲ {post.upvoteCount || 0}
                    </Button>

                    {(user?._id === post.author?._id || user?.role === "admin") && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={(e) => handleDelete(post._id, e)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <NewPostModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(newPost) => setPosts((prev) => [newPost, ...prev])}
      />
    </AppShell>
  );
}
