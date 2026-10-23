import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getBlogCategories,
  createBlogCategory,
  getBlogCategoryById,
  updateBlogCategory,
  deleteBlogCategory,
} from '../controllers/blogCategories.js';

const router = express.Router();

// GET /api/admin/blog-categories
router.get('/', requireAuth, getBlogCategories);

// POST /api/admin/blog-categories
router.post('/', requireAuth, requireRole(['super_admin', 'admin']), createBlogCategory);

// GET /api/admin/blog-categories/:id
router.get('/:id', requireAuth, getBlogCategoryById);

// PUT /api/admin/blog-categories/:id
router.put('/:id', requireAuth, requireRole(['super_admin', 'admin']), updateBlogCategory);

// DELETE /api/admin/blog-categories/:id
router.delete('/:id', requireAuth, requireRole(['super_admin', 'admin']), deleteBlogCategory);

export default router;
