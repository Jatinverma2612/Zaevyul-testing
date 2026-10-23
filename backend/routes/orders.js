import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getOrders,
  getOrderById,
  updateOrder,
  addOrderNote,
  downloadAdminInvoice,
  regenerateAdminInvoice,
} from '../controllers/orders.js';

const router = express.Router();

// GET /api/admin/orders
router.get('/', requireAuth, getOrders);

// GET /api/admin/orders/:id/invoice
router.get('/:id/invoice', requireAuth, downloadAdminInvoice);

// POST /api/admin/orders/:id/invoice/regenerate
router.post('/:id/invoice/regenerate', requireAuth, regenerateAdminInvoice);

// GET /api/admin/orders/:id
router.get('/:id', requireAuth, getOrderById);

// PUT /api/admin/orders/:id (Update Status)
router.put('/:id', requireAuth, updateOrder);

// POST /api/admin/orders/:id/notes
router.post('/:id/notes', requireAuth, addOrderNote);

export default router;
