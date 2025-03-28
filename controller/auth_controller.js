const bcrypt = require('bcrypt');
const db = require('../models');
const tokenHelper = require('../helpers/token_helper');
const emailHelper = require('../helpers/email_helper');
const { Op } = require('sequelize');

/**
 * Register a new user
 */
const register = async (req, res) => {
  const { first_name, last_name, email, password, phone_number } = req.body;
  
  try {
    // Check if user with this email already exists
    const existingEmail = await db.Users.findOne({ where: { email } });
    
    // Check if user with this phone number already exists
    const existingPhone = await db.Users.findOne({ where: { phone_number } });
    
    // Handle different cases of existing credentials
    if (existingEmail && existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'Both email and phone number are already registered'
      });
    }
    
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message: 'User with this phone number already exists'
      });
    }
    
    // Get the USER role_id
    const userRole = await db.roles.findOne({ where: { role: 'USER' } });
    if (!userRole) {
      return res.status(500).json({
        success: false,
        message: 'Role configuration error'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const user = await db.Users.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      phone_number,
      role_id: userRole.role_id,
      is_verified: false,
      is_active: true
    });
    
    // Generate verification token
    const verificationToken = tokenHelper.generateVerificationToken();
    
    // Save verification token
    await tokenHelper.saveToken(
      user.user_id,
      verificationToken,
      'VERIFICATION'
    );
    
    // Send verification email
    let emailSent = false;
    try {
      await emailHelper.sendVerificationEmail(user, verificationToken);
      emailSent = true;
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // In development, log the verification token for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Verification token for testing:', verificationToken);
      }
    }
    
    // For development environment, include token in response
    if (process.env.NODE_ENV === 'development') {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.',
        data: {
          user_id: user.user_id,
          email: user.email,
          verification_token: verificationToken,
          email_sent: emailSent
        }
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        user_id: user.user_id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Sequelize unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const fields = Object.keys(error.fields);
      
      if (fields.includes('email') && fields.includes('phone_number')) {
        return res.status(400).json({
          success: false,
          message: 'Both email and phone number are already registered'
        });
      }
      
      if (fields.includes('email')) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      if (fields.includes('phone_number')) {
        return res.status(400).json({
          success: false,
          message: 'User with this phone number already exists'
        });
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration'
    });
  }
};

/**
 * Verify user email
 */
const verifyEmail = async (req, res) => {
  const { token } = req.body;
  
  try {
    // Find the verification token
    const tokenRecord = await tokenHelper.findToken(token, 'VERIFICATION');
    
    if (!tokenRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }
    
    if (tokenRecord.is_revoked) {
      return res.status(400).json({
        success: false,
        message: 'This verification token has already been used'
      });
    }
    
    // Get the user
    const user = await db.Users.findByPk(tokenRecord.user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }
    
    // Update user verification status
    await user.update({ is_verified: true });
    
    // Revoke the verification token
    try {
      await tokenHelper.revokeToken(token, 'VERIFICATION');
    } catch (revokeError) {
      console.error('Error revoking token:', revokeError);
      // Continue execution even if token revocation fails
    }
    
    // Send welcome email
    try {
      await emailHelper.sendWelcomeEmail(user);
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Continue execution even if welcome email fails
    }
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * User login
 */
const login = async (req, res) => {
  const { email, password, remember_me } = req.body;
  
  try {
    // Find user by email
    const user = await db.Users.findOne({
      where: { email },
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['role']
      }]
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }
    
    // Generate tokens
    const accessToken = tokenHelper.generateAccessToken(user);
    const refreshToken = tokenHelper.generateRefreshToken();
    
    // Get device info
    const deviceInfo = req.headers['user-agent'] || null;
    
    // Save refresh token to database
    await tokenHelper.saveToken(
      user.user_id,
      refreshToken,
      'REFRESH',
      deviceInfo
    );
    
    // Set refresh token as HTTP-only cookie
    const refreshTokenExpiry = remember_me ? 
      tokenHelper.REFRESH_TOKEN_EXPIRY * 2 : // Double expiry if remember_me is true
      tokenHelper.REFRESH_TOKEN_EXPIRY;
      
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: refreshTokenExpiry * 1000,
      sameSite: 'strict'
    });
    
    // Log login in audit trail
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'LOGIN',
      description: `User logged in from ${deviceInfo || 'unknown device'}`
    });
    
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role.role,
        access_token: accessToken,
        token_type: 'Bearer'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (req, res) => {
  // Get refresh token from cookie or request body
  const token = req.cookies.refresh_token || req.body.refresh_token;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token is required'
    });
  }
  
  try {
    // Find the refresh token in the database
    const tokenRecord = await tokenHelper.findToken(token, 'REFRESH');
    
    if (!tokenRecord || tokenRecord.is_revoked) {
      // Clear the cookie if it exists
      if (req.cookies.refresh_token) {
        res.clearCookie('refresh_token');
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Get the user
    const user = await db.Users.findOne({
      where: { 
        user_id: tokenRecord.user_id,
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
    
    // Generate new access token
    const newAccessToken = tokenHelper.generateAccessToken(user);
    
    return res.status(200).json({
      success: true,
      data: {
        access_token: newAccessToken,
        token_type: 'Bearer'
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during token refresh'
    });
  }
};

/**
 * User logout
 */
const logout = async (req, res) => {
  // Get refresh token from cookie
  const token = req.cookies.refresh_token;
  
  if (token) {
    try {
      // Revoke the refresh token
      await tokenHelper.revokeToken(token);
      
      // Clear the cookie
      res.clearCookie('refresh_token');
      
      // Log logout in audit trail
      await db.audit_trail.create({
        email: req.user.email,
        user_id: req.user.user_id,
        action: 'LOGOUT',
        description: 'User logged out'
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if there's an error
    }
  }
  
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

/**
 * Request password reset
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Find user by email
    const user = await db.Users.findOne({ where: { email } });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive password reset instructions'
      });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive password reset instructions'
      });
    }
    
    // Generate password reset token
    const resetToken = tokenHelper.generatePasswordResetToken();
    
    // Revoke any existing password reset tokens
    await tokenHelper.revokeAllUserTokens(user.user_id, 'PASSWORD_RESET');
    
    // Save password reset token
    await tokenHelper.saveToken(
      user.user_id,
      resetToken,
      'PASSWORD_RESET'
    );
    
    // Send password reset email
    await emailHelper.sendPasswordResetEmail(user, resetToken);
    
    return res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive password reset instructions'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
};

/**
 * Reset password using token
 */
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  
  try {
    // Find the password reset token
    const tokenRecord = await tokenHelper.findToken(token, 'PASSWORD_RESET');
    
    if (!tokenRecord || tokenRecord.is_revoked) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }
    
    // Get the user
    const user = await db.Users.findOne({
      where: { 
        user_id: tokenRecord.user_id,
        is_active: true 
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user password
    await user.update({ password: hashedPassword });
    
    // Revoke the password reset token
    await tokenHelper.revokeToken(token);
    
    // Revoke all refresh tokens for security
    await tokenHelper.revokeAllUserTokens(user.user_id, 'REFRESH');
    
    // Log password reset in audit trail
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'PASSWORD_RESET',
      description: 'User reset password'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during password reset'
    });
  }
};

/**
 * Change password (authenticated user)
 */
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  const userId = req.user.user_id;
  
  try {
    // Get user
    const user = await db.Users.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(current_password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);
    
    // Update user password
    await user.update({ password: hashedPassword });
    
    // Revoke all refresh tokens except current one for security
    const currentToken = req.cookies.refresh_token;
    if (currentToken) {
      const tokens = await db.auth_tokens.findAll({
        where: {
          user_id: userId,
          token_type: 'REFRESH',
          is_revoked: false,
          token: { [Op.ne]: currentToken }
        }
      });
      
      for (const token of tokens) {
        await token.update({ is_revoked: true });
      }
    }
    
    // Log password change in audit trail
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'PASSWORD_CHANGE',
      description: 'User changed password'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during password change'
    });
  }
};

/**
 * Get current user profile
 */
const getProfile = async (req, res) => {
  const userId = req.user.user_id;
  
  try {
    const user = await db.Users.findOne({
      where: { user_id: userId },
      include: [{
        model: db.roles,
        as: 'role',
        attributes: ['role']
      }],
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        user_id: user.user_id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        role: user.role.role,
        is_verified: user.is_verified,
        is_active: user.is_active,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user profile'
    });
  }
};

/**
 * Resend verification email
 */
const resendVerification = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Find user by email
    const user = await db.Users.findOne({ where: { email } });
    
    // Don't reveal if user exists or not for security
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered and not verified, you will receive a new verification email'
      });
    }
    
    // Check if user is already verified
    if (user.is_verified) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered and not verified, you will receive a new verification email'
      });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(200).json({
        success: true,
        message: 'If your email is registered and not verified, you will receive a new verification email'
      });
    }
    
    // Revoke any existing verification tokens
    await tokenHelper.revokeAllUserTokens(user.user_id, 'VERIFICATION');
    
    // Generate new verification token
    const verificationToken = tokenHelper.generateVerificationToken();
    
    // Save verification token
    await tokenHelper.saveToken(
      user.user_id,
      verificationToken,
      'VERIFICATION'
    );
    
    // Send verification email
    let emailSent = false;
    try {
      await emailHelper.sendVerificationEmail(user, verificationToken);
      emailSent = true;
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // In development, log the verification token for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Verification token for testing:', verificationToken);
      }
    }
    
    // For development environment, return success even if email fails
    if (process.env.NODE_ENV === 'development') {
      return res.status(200).json({
        success: true,
        message: 'Verification email has been queued for delivery',
        data: {
          // Only include token in development mode
          verification_token: verificationToken,
          email_sent: emailSent
        }
      });
    }
    
    // For production, only return success if email was actually sent
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again later.'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'If your email is registered and not verified, you will receive a new verification email'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  resendVerification
};