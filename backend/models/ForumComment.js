// backend/models/ForumComment.js
const mongoose = require("mongoose");

const forumCommentSchema = new mongoose.Schema(
  {
    post:      { type: mongoose.Schema.Types.ObjectId, ref: "ForumPost", required: true },
    author:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content:   { type: String, required: true, trim: true },
    upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isExpert:  { type: Boolean, default: false }, // marked if author is admin/expert
    isRemoved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

forumCommentSchema.virtual("upvoteCount").get(function () {
  return this.upvotes.length;
});
forumCommentSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("ForumComment", forumCommentSchema);