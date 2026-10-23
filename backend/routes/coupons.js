import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
  bulkDeleteCoupons,
} from '../controllers/coupons.js';

const router = express.Router();

// GET /api/admin/coupons
router.get('/', requireAuth, getCoupons);

// POST /api/admin/coupons
router.post('/', requireAuth, requireRole(['super_admin', 'admin']), createCoupon);

// POST /api/admin/coupons/bulk-delete
router.post('/bulk-delete', requireAuth, requireRole(['super_admin', 'admin']), bulkDeleteCoupons);

// PUT /api/admin/coupons/:id
router.put('/:id', requireAuth, requireRole(['super_admin', 'admin']), updateCoupon);

// PUT /api/admin/coupons/:id/toggle (Toggle Active Status)
router.put('/:id/toggle', requireAuth, requireRole(['super_admin', 'admin']), toggleCouponStatus);

// DELETE /api/admin/coupons/:id
router.delete('/:id', requireAuth, requireRole(['super_admin', 'admin']), deleteCoupon);

export default router;
