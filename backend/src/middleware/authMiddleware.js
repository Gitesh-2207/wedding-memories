import jwt from 'jsonwebtoken';
import { Admin } from '../models/Admin.js';

export const requireAdminAuth = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in as an administrator.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET || 'royal_wedding_memories_secure_jwt_secret_dev_2026';
    const decoded = jwt.verify(token, jwtSecret);

    const admin = await Admin.findById(decoded.adminId).populate('weddingId');
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Administrator account not found or has been revoked.'
      });
    }

    req.admin = admin;
    req.weddingId = admin.weddingId._id;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.'
    });
  }
};
