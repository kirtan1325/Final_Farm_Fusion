// backend/controllers/forumController.js
const ForumPost    = require("../models/ForumPost");
const ForumComment = require("../models/ForumComment");

// ── POSTS ──────────────────────────────────────────────

// @desc  Get all posts
// @route GET /api/forum?category=disease&search=wheat
const getPosts = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const filter = { isRemoved: false };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title:   { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
      ];
    }

    const total = await ForumPost.countDocuments(filter);
    const posts = await ForumPost.find(filter)
      .populate("author", "name role avatar farmName")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Add comment count to each post
    const postsWithCount = await Promise.all(
      posts.map(async (post) => {
        const commentCount = await ForumComment.countDocuments({ post: post._id, isRemoved: false });
        return { ...post.toJSON(), commentCount };
      })
    );

    res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / Number(limit)), data: postsWithCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single post with comments
// @route GET /api/forum/:id
const getPost = async (req, res) => {
  try {
    const post = await ForumPost.findOneAndUpdate(
      { _id: req.params.id, isRemoved: false },
      { $inc: { views: 1 } },
      { returnDocument: "after" }
    ).populate("author", "name role avatar farmName");

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comments = await ForumComment.find({ post: post._id, isRemoved: false })
      .populate("author", "name role avatar farmName")
      .sort({ isExpert: -1, createdAt: 1 });

    res.json({ success: true, data: { ...post.toJSON(), comments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create post
// @route POST /api/forum
const createPost = async (req, res) => {
  try {
    const { title, content, category, tags, imageUrl } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: "Title and content required" });

    const post = await ForumPost.create({ author: req.user._id, title, content, category, tags, imageUrl });
    await post.populate("author", "name role avatar farmName");
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Upvote a post
// @route PATCH /api/forum/:id/upvote
const upvotePost = async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const idx = post.upvotes.indexOf(req.user._id);
    if (idx === -1) {
      post.upvotes.push(req.user._id); // add upvote
    } else {
      post.upvotes.splice(idx, 1);     // remove upvote (toggle)
    }
    await post.save();
    res.json({ success: true, upvoteCount: post.upvotes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Mark post as resolved
// @route PATCH /api/forum/:id/resolve
const resolvePost = async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });
    post.isResolved = true;
    await post.save();
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete own post
// @route DELETE /api/forum/:id
const deletePost = async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };
    await ForumPost.findOneAndUpdate(filter, { isRemoved: true });
    res.json({ success: true, message: "Post removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── COMMENTS ───────────────────────────────────────────

// @desc  Add comment to post
// @route POST /api/forum/:id/comments
const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: "Comment content required" });

    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const comment = await ForumComment.create({
      post:     req.params.id,
      author:   req.user._id,
      content,
      isExpert: req.user.role === "admin",
    });
    await comment.populate("author", "name role avatar farmName");
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Upvote a comment
// @route PATCH /api/forum/comments/:id/upvote
const upvoteComment = async (req, res) => {
  try {
    const comment = await ForumComment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    const idx = comment.upvotes.indexOf(req.user._id);
    if (idx === -1) comment.upvotes.push(req.user._id);
    else comment.upvotes.splice(idx, 1);
    await comment.save();
    res.json({ success: true, upvoteCount: comment.upvotes.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete comment
// @route DELETE /api/forum/comments/:id
const deleteComment = async (req, res) => {
  try {
    const filter = req.user.role === "admin"
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };
    await ForumComment.findOneAndUpdate(filter, { isRemoved: true });
    res.json({ success: true, message: "Comment removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPosts, getPost, createPost, upvotePost, resolvePost, deletePost, addComment, upvoteComment, deleteComment };
