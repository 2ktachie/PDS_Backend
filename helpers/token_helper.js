const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../models');

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const VERIFICATION_TOKEN_EXPIRY = 24 * 60 * 60; // 24 hours
const PASSWORD_RESET_TOKEN_EXPIRY = 1 * 60 * 60; // 1 hour

/**
 * Generate a JWT access token
 * @param {Object} user - User object with id, email, and role
 * @returns {String} JWT token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role?.role || 'USER',
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate a secure random refresh token
 * @returns {String} Random token
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Generate a verification token for email verification
 * @returns {String} Random token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate a password reset token
 * @returns {String} Random token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Save a token to the database
 * @param {String} userId - User ID
 * @param {String} token - Token string
 * @param {String} tokenType - Token type (ACCESS, REFRESH, VERIFICATION, PASSWORD_RESET)
 * @param {String} deviceInfo - Device information (optional)
 * @returns {Promise} Promise resolving to the created token
 */
const saveToken = async (userId, token, tokenType, deviceInfo = null) => {
  let expiryDate;
  
  switch (tokenType) {
    case 'ACCESS':
      expiryDate = new Date(Date.now() + ACCESS_TOKEN_EXPIRY * 1000);
      break;
    case 'REFRESH':
      expiryDate = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
      break;
    case 'VERIFICATION':
      expiryDate = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY * 1000);
      break;
    case 'PASSWORD_RESET':
      expiryDate = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY * 1000);
      break;
    default:
      throw new Error('Invalid token type');
  }
  
  return await db.auth_tokens.create({
    user_id: userId,
    token: token,
    token_type: tokenType,
    expires_at: expiryDate,
    device_info: deviceInfo
  });
};

/**
 * Verify a JWT access token
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Find a token in the database
 * @param {String} token - Token string
 * @param {String} tokenType - Token type
 * @returns {Promise} Promise resolving to the token or null
 */
const findToken = async (token, tokenType) => {
  return await db.auth_tokens.findOne({
    where: {
      token: token,
      token_type: tokenType,
      is_revoked: false,
      expires_at: { [db.Sequelize.Op.gt]: new Date() }
    }
  });
};

/**
 * Revoke a token
 * @param {String} token - Token to revoke
 * @param {String} tokenType - Type of token (optional)
 * @returns {Promise} Promise resolving to the updated token record
 */
const revokeToken = async (token, tokenType) => {
  try {
    const whereClause = {
      token,
      is_revoked: false
    };
    
    // Add token_type to where clause if provided
    if (tokenType) {
      whereClause.token_type = tokenType;
    }
    
    const tokenRecord = await db.auth_tokens.findOne({
      where: whereClause
    });
    
    if (!tokenRecord) {
      return null;
    }
    
    return await tokenRecord.update({ is_revoked: true });
  } catch (error) {
    console.error('Error revoking token:', error);
    throw error;
  }
};

/**
 * Revoke all tokens for a user
 * @param {String} userId - User ID
 * @param {String} tokenType - Token type (optional)
 * @returns {Promise} Promise resolving to the number of affected rows
 */
const revokeAllUserTokens = async (userId, tokenType = null) => {
  const whereClause = {
    user_id: userId,
    is_revoked: false
  };
  
  if (tokenType) {
    whereClause.token_type = tokenType;
  }
  
  return await db.auth_tokens.update(
    { is_revoked: true },
    { where: whereClause }
  );
};

/**
 * Clean up expired tokens
 * @returns {Promise} Promise resolving to the number of deleted rows
 */
const cleanupExpiredTokens = async () => {
  return await db.auth_tokens.destroy({
    where: {
      expires_at: { [db.Sequelize.Op.lt]: new Date() }
    }
  });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateVerificationToken,
  generatePasswordResetToken,
  saveToken,
  verifyAccessToken,
  findToken,
  revokeToken,
  revokeAllUserTokens,
  cleanupExpiredTokens,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  VERIFICATION_TOKEN_EXPIRY,
  PASSWORD_RESET_TOKEN_EXPIRY
};
