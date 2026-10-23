import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getReports } from '../controllers/reports.js';

const router = express.Router();

// GET /api/admin/reports
router.get('/', requireAuth, getReports);

export default router;
