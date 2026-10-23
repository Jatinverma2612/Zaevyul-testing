import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getSettings,
  updateSettings,
  getBranding,
  uploadLogo,
  uploadFavicon,
  deleteLogo,
  deleteFavicon,
} from '../controllers/settings.js';

const router = express.Router();

// GET /api/admin/settings
router.get('/', requireAuth, getSettings);

// PUT /api/admin/settings
router.put('/', requireAuth, requireRole(['super_admin', 'admin']), updateSettings);

// Branding endpoints
router.get('/branding', requireAuth, getBranding);
router.post('/branding/logo', requireAuth, requireRole(['super_admin', 'admin']), uploadLogo);
router.post('/branding/favicon', requireAuth, requireRole(['super_admin', 'admin']), uploadFavicon);
router.delete('/branding/logo', requireAuth, requireRole(['super_admin', 'admin']), deleteLogo);
router.delete('/branding/favicon', requireAuth, requireRole(['super_admin', 'admin']), deleteFavicon);

export default router;

