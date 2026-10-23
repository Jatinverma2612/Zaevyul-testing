import express from 'express';
import { requireCustomerAuth } from '../middleware/customerAuth.js';
import {
  addCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddress,
  getCustomerAddresses,
  lookupCustomerPostalCode,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from '../controllers/customerAddresses.js';

const router = express.Router();

router.use(requireCustomerAuth);

router.get('/', getCustomerAddresses);
router.post('/', addCustomerAddress);
router.get('/postal-lookup', lookupCustomerPostalCode);
router.get('/:addressId', getCustomerAddress);
router.put('/:addressId', updateCustomerAddress);
router.patch('/:addressId', updateCustomerAddress);
router.delete('/:addressId', deleteCustomerAddress);
router.put('/:addressId/default', setDefaultCustomerAddress);

export default router;
