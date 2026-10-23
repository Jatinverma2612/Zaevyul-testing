import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getProducts,
  getFeaturedProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  bulkDeleteProducts,
  toggleFeatured,
} from '../controllers/products.js';

const router = express.Router();

// GET /api/admin/products
router.get('/', requireAuth, getProducts);

// GET /api/admin/products/featured — public, no auth needed
router.get('/featured', getFeaturedProducts);

// POST /api/admin/products/bulk-delete (Bulk Delete)
router.post('/bulk-delete', requireAuth, requireRole(['super_admin', 'admin']), bulkDeleteProducts);

// GET /api/admin/products/:id
router.get('/:id', requireAuth, getProductById);

// POST /api/admin/products (New)
router.post('/', requireAuth, requireRole(['super_admin', 'admin']), createProduct);

// PUT /api/admin/products/:id (Update)
router.put('/:id', requireAuth, requireRole(['super_admin', 'admin']), updateProduct);

// DELETE /api/admin/products/:id (Delete)
router.delete('/:id', requireAuth, requireRole(['super_admin', 'admin']), deleteProduct);

// POST /api/admin/products/:id/duplicate (Duplicate)
router.post('/:id/duplicate', requireAuth, requireRole(['super_admin', 'admin']), duplicateProduct);

// PATCH /api/admin/products/:id/featured
router.patch('/:id/featured', requireAuth, requireRole(['super_admin', 'admin']), toggleFeatured);

export default router;
