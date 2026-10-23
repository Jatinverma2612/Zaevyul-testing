import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/profile.js';

const router = express.Router();

// GET /api/admin/profile
router.get('/', requireAuth, getProfile);

// PUT /api/admin/profile
router.put('/', requireAuth, updateProfile);

// POST /api/admin/profile/change-password
router.post('/change-password', requireAuth, changePassword);

export default router;
