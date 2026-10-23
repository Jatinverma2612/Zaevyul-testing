import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getBlogs,
  getPublicBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blogs.js";

const router = express.Router();

// GET /api/admin/blogs/public
router.get("/public", getPublicBlogs);

// GET /api/admin/blogs
router.get("/", requireAuth, getBlogs);

// GET /api/admin/blogs/:id
router.get("/:id", requireAuth, getBlogById);

// POST /api/admin/blogs
router.post("/", requireAuth, createBlog);

// PUT /api/admin/blogs/:id
router.put("/:id", requireAuth, updateBlog);

// DELETE /api/admin/blogs/:id
router.delete("/:id", requireAuth, deleteBlog);

export default router;
