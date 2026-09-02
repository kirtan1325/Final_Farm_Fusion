import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPost, addComment, upvotePost, upvoteComment, deleteComment, resolvePost } from "../api/forumService";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Textarea } from "../components/ui/Input";
import Skeleton from "../components/ui/Skeleton";

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ForumPostDetail() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    try {
      const data = await getPost(id);
      setPost(data.data);
      setComments(data.data.comments || []);
    } catch (err) {
      toast.error("Discussion post not found.");
      navigate("/forum");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const data = await addComment(id, { content: newComment });
      setComments((prev) => [...prev, data.data]);
      setNewComment("");
      toast.success("Reply posted!");
    } catch (err) {
      toast.error("Failed to post reply.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvotePost = async () => {
    try {
      const data = await upvotePost(id);
      setPost((prev) => ({ ...prev, upvoteCount: data.upvoteCount }));
    } catch (err) {
      toast.error("Failed to upvote post.");
    }
  };

  const handleUpvoteComment = async (cid) => {
    try {
      const data = await upvoteComment(cid);
      setComments((prev) => prev.map((c) => (c._id === cid ? { ...c, upvoteCount: data.upvoteCount } : c)));
    } catch (err) {
      toast.error("Failed to upvote comment.");
    }
  };

  const handleDeleteComment = async (cid) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await deleteComment(cid);
      setComments((prev) => prev.filter((c) => c._id !== cid));
      toast.success("Reply deleted.");
    } catch (err) {
      toast.error("Failed to delete reply.");
    }
  };

  const handleResolve = async () => {
    try {
      await resolvePost(id);
      setPost((prev) => ({ ...prev, isResolved: true }));
      toast.success("Marked as resolved!");
    } catch (err) {
      toast.error("Failed to mark as resolved.");
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
      title="Discussion Details"
      subtitle="View discussion thread and community answers."
      headerActions={
        <Button variant="outline" size="sm" onClick={() => navigate("/forum")}>
          ← Back to Forum
        </Button>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {loading ? (
          <Skeleton className="h-64" />
        ) : post ? (
          <>
            {/* Main Post Card */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="emerald">{post.category || "General"}</Badge>
                    {post.isResolved && <Badge variant="success">✓ Resolved</Badge>}
                  </div>
                  <span className="text-xs text-slate-400">
                    Posted by <strong>{post.author?.name || "Community Member"}</strong> • {fmtDate(post.createdAt)}
                  </span>
                </div>

                <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">{post.title}</h1>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>

                {post.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-slate-200 max-h-96 bg-slate-100">
                    <img src={post.imageUrl} alt="Attached photo" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={handleUpvotePost}>
                    ▲ Upvote ({post.upvoteCount || 0})
                  </Button>

                  {user?._id === post.author?._id && !post.isResolved && (
                    <Button variant="secondary" size="sm" onClick={handleResolve}>
                      ✓ Mark as Resolved
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Replies Section */}
            <Card>
              <CardHeader>
                <CardTitle>Community Replies ({comments.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Reply Form */}
                <form onSubmit={handleComment} className="space-y-3">
                  <Textarea
                    placeholder="Write a helpful response..."
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <div className="flex justify-end">
                    <Button type="submit" loading={submitting} size="sm">
                      Post Reply
                    </Button>
                  </div>
                </form>

                {/* List of Comments */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {comments.map((comm) => (
                    <div key={comm._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {comm.author?.name || "Community Member"}
                        </span>
                        <span className="text-slate-400">{fmtDate(comm.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{comm.content}</p>
                      <div className="flex items-center justify-between pt-2 text-xs">
                        <button
                          onClick={() => handleUpvoteComment(comm._id)}
                          className="font-semibold text-slate-500 hover:text-emerald-700 cursor-pointer"
                        >
                          ▲ {comm.upvoteCount || 0} Upvotes
                        </button>
                        {(user?._id === comm.author?._id || user?.role === "admin") && (
                          <button
                            onClick={() => handleDeleteComment(comm._id)}
                            className="font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}