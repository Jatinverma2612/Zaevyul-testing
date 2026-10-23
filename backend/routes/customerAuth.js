import express from 'express';
import rateLimit from 'express-rate-limit';
import { requireCustomerAuth } from '../middleware/customerAuth.js';
import {
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp,
  googleLogin,
  getMe,
  logout,
  updateCustomerProfile,
  updateCustomerMarketing,
} from '../controllers/customerAuth.js';
import {
  addCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddress,
  getCustomerAddresses,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from '../controllers/customerAddresses.js';

const router = express.Router();

// Rate limiters disabled for local testing/consistency
const otpSendLimiter = (req, res, next) => next();
const otpVerifyLimiter = (req, res, next) => next();
const googleLimiter = (req, res, next) => next();

// Email OTP
router.post('/email/send-otp', otpSendLimiter, sendEmailOtp);
router.post('/email/verify-otp', otpVerifyLimiter, verifyEmailOtp);

// Phone OTP
router.post('/phone/send-otp', otpSendLimiter, sendPhoneOtp);
router.post('/phone/verify-otp', otpVerifyLimiter, verifyPhoneOtp);

// Google Login
router.post('/google', googleLimiter, googleLogin);

// Session
router.get('/me', requireCustomerAuth, getMe);
router.post('/logout', logout);

// Profile and marketing preferences updates
router.put('/profile', requireCustomerAuth, updateCustomerProfile);
router.put('/marketing', requireCustomerAuth, updateCustomerMarketing);

// Address management
router.get('/address', requireCustomerAuth, getCustomerAddresses);
router.post('/address', requireCustomerAuth, addCustomerAddress);
router.get('/address/:addressId', requireCustomerAuth, getCustomerAddress);
router.put('/address/:addressId', requireCustomerAuth, updateCustomerAddress);
router.patch('/address/:addressId', requireCustomerAuth, updateCustomerAddress);
router.delete('/address/:addressId', requireCustomerAuth, deleteCustomerAddress);
router.put('/address/:addressId/default', requireCustomerAuth, setDefaultCustomerAddress);

export default router;
