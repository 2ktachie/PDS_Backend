const tokenHelper = require('../helpers/token_helper');
const db = require('../models');

/**
 * Middleware to verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = tokenHelper.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Check if user exists and is active
    const user = await db.Users.findOne({
      where: { 
        user_id: decoded.user_id,
        is_active: true 
      },
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['role']
      }]
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Attach user info to request object
    req.user = {
      user_id: user.user_id,
      email: user.email,
      role: user.role.role,
      is_verified: user.is_verified
    };
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

/**
 * Middleware to check if user is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user.is_verified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required'
    });
  }
  next();
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    next();
  };
};

/**
 * Middleware to refresh token if needed
 */
const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    // Verify token without throwing
    const decoded = tokenHelper.verifyAccessToken(token);
    
    // If token is valid but close to expiry (less than 5 minutes), refresh it
    if (decoded && decoded.exp) {
      const expiryTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeToExpiry = expiryTime - currentTime;
      
      // If token expires in less than 5 minutes, issue a new one
      if (timeToExpiry > 0 && timeToExpiry < 5 * 60 * 1000) {
        const user = await db.Users.findOne({
          where: { user_id: decoded.user_id },
          include: [{
            model: db.roles,
            as: 'role',
            attributes: ['role']
          }]
        });
        
        if (user) {
          const newToken = tokenHelper.generateAccessToken(user);
          res.setHeader('X-New-Access-Token', newToken);
        }
      }
    }
    
    next();
  } catch (error) {
    // Just continue if there's an error
    next();
  }
};

module.exports = {
  authenticateToken,
  requireVerified,
  requireAdmin,
  requireRole,
  refreshTokenIfNeeded
};
