// backend/models/ForumPost.js
const mongoose = require("mongoose");

const forumPostSchema = new mongoose.Schema(
  {
    author:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title:    { type: String, required: true, trim: true },
    content:  { type: String, required: true },
    category: {
      type: String,
      enum: ["general", "disease", "weather", "market", "technique", "equipment", "other"],
      default: "general",
    },
    imageUrl:  { type: String }, // For uploading crop issue images
    tags:      [{ type: String }],
    upvotes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views:     { type: Number, default: 0 },
    isResolved:{ type: Boolean, default: false },
    isPinned:  { type: Boolean, default: false },  // admin can pin
    isRemoved: { type: Boolean, default: false },  // admin soft delete
  },
  { timestamps: true }
);

forumPostSchema.virtual("upvoteCount").get(function () {
  return this.upvotes.length;
});
forumPostSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("ForumPost", forumPostSchema);