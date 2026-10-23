import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getSubscribers,
  deleteSubscriber,
  bulkDeleteSubscribers,
} from '../controllers/newsletter.js';

const router = express.Router();

// GET /api/admin/newsletter
router.get('/', requireAuth, getSubscribers);

// DELETE /api/admin/newsletter/:id
router.delete('/:id', requireAuth, requireRole(['super_admin', 'admin']), deleteSubscriber);

// POST /api/admin/newsletter/bulk-delete
router.post('/bulk-delete', requireAuth, requireRole(['super_admin', 'admin']), bulkDeleteSubscribers);

export default router;
