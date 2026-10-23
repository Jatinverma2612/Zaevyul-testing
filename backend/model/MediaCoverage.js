import mongoose from "mongoose";

const MediaCoverageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Article title is required"],
      trim: true,
    },
    articleUrl: {
      type: String,
      required: [true, "Article/publication URL is required"],
      trim: true,
    },
    sourceName: {
      type: String,
      default: "",
      trim: true,
    },
    excerpt: {
      type: String,
      default: "",
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
    },
    image: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    publishedAt: {
      type: Date,
      default: Date.now,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("MediaCoverage", MediaCoverageSchema);
