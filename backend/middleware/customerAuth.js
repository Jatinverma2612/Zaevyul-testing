import jwt from 'jsonwebtoken';
import CustomerUser from '../model/CustomerUser.js';

const CUSTOMER_JWT_SECRET =
  process.env.CUSTOMER_JWT_SECRET || 'zaevyul_customer_secret_key_74829';

/**
 * requireCustomerAuth
 * Verifies the customer JWT from cookie or Authorization header.
 * Attaches the CustomerUser document to req.customerUser.
 * Rejects admin tokens — role must be "customer".
 */
export const requireCustomerAuth = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.zae_customer_token) {
      token = req.cookies.zae_customer_token;
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: 'Not authorized. Please log in.' });
    }

    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET);

    // Reject tokens that don't carry the customer role
    if (decoded.role !== 'customer') {
      return res
        .status(403)
        .json({ success: false, message: 'Access denied. Customer account required.' });
    }

    const customer = await CustomerUser.findById(decoded.userId).select('-__v');
    if (!customer) {
      return res
        .status(401)
        .json({ success: false, message: 'Account not found. Please log in again.' });
    }

    req.customerUser = customer;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

/**
 * optionalCustomerAuth
 * Attaches the CustomerUser to req.customerUser if a valid token is present.
 * Does NOT block the request if no token is present — just sets req.customerUser = null.
 */
export const optionalCustomerAuth = async (req, res, next) => {
  try {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.zae_customer_token) {
      token = req.cookies.zae_customer_token;
    }

    if (!token) {
      req.customerUser = null;
      return next();
    }

    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET);
    if (decoded.role !== 'customer') {
      req.customerUser = null;
      return next();
    }

    req.customerUser = await CustomerUser.findById(decoded.userId).select('-__v');
  } catch {
    req.customerUser = null;
  }
  next();
};

/**
 * Sign a JWT for a CustomerUser.
 * Exported so the auth controller can use it.
 */
export const signCustomerToken = (customerId) =>
  jwt.sign({ userId: customerId, role: 'customer' }, CUSTOMER_JWT_SECRET, {
    expiresIn: '30d',
  });

/**
 * Set the customer auth cookie on the response.
 */
export const setCustomerCookie = (res, token) => {
  res.cookie('zae_customer_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};
