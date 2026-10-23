import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getCategories,
  getFeaturedCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  toggleFeatured,
} from '../controllers/categories.js';

const router = express.Router();

// GET /api/admin/categories/featured  — public, no auth needed
router.get('/featured', getFeaturedCategories);

// GET /api/admin/categories
router.get('/', requireAuth, getCategories);

// POST /api/admin/categories
router.post('/', requireAuth, requireRole(['super_admin', 'admin']), createCategory);

// GET /api/admin/categories/:id
router.get('/:id', requireAuth, getCategoryById);

// PUT /api/admin/categories/:id
router.put('/:id', requireAuth, requireRole(['super_admin', 'admin']), updateCategory);

// PATCH /api/admin/categories/:id/featured
router.patch('/:id/featured', requireAuth, requireRole(['super_admin', 'admin']), toggleFeatured);

// DELETE /api/admin/categories/:id
router.delete('/:id', requireAuth, requireRole(['super_admin', 'admin']), deleteCategory);

export default router;
