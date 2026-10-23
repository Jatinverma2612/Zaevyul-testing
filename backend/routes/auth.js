import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { login, logout, getMe } from '../controllers/auth.js';

const router = express.Router();

// POST /login
router.post('/login', login);

// POST /logout
router.post('/logout', logout);

// GET /me
router.get('/me', requireAuth, getMe);

export default router;
