// backend/routes/forumRoutes.js
const express  = require("express");
const router   = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getPosts, getPost, createPost, upvotePost, resolvePost, deletePost,
  addComment, upvoteComment, deleteComment,
} = require("../controllers/forumController");

// Posts
router.get("/",              protect, getPosts);
router.get("/:id",           protect, getPost);
router.post("/",             protect, createPost);
router.patch("/:id/upvote",  protect, upvotePost);
router.patch("/:id/resolve", protect, resolvePost);
router.delete("/:id",        protect, deletePost);

// Comments
router.post("/:id/comments",          protect, addComment);
router.patch("/comments/:id/upvote",  protect, upvoteComment);
router.delete("/comments/:id",        protect, deleteComment);

module.exports = router;
