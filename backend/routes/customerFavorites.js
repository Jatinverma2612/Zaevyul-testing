import express from 'express';
import { requireCustomerAuth } from '../middleware/customerAuth.js';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from '../controllers/customerFavorites.js';

const router = express.Router();

// All favorites routes require a logged-in customer
router.get('/', requireCustomerAuth, getFavorites);
router.post('/:productId', requireCustomerAuth, addFavorite);
router.delete('/:productId', requireCustomerAuth, removeFavorite);

export default router;
