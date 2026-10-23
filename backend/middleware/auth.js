import jwt from 'jsonwebtoken';
import Admin from '../model/Admin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'zaevyul_secret_key_12984';

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;
    
    // Check Authorization header or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.zae_token) {
      token = req.cookies.zae_token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await Admin.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    
    const allowed = Array.isArray(roles) ? roles.includes(req.user.role) : req.user.role === roles;
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Access forbidden: insufficient permissions' });
    }
    
    next();
  };
};
