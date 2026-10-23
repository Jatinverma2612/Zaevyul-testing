import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCustomers, getCustomerById } from '../controllers/customers.js';

const router = express.Router();

// GET /api/admin/customers
router.get('/', requireAuth, getCustomers);

// GET /api/admin/customers/:id
router.get('/:id', requireAuth, getCustomerById);

export default router;
