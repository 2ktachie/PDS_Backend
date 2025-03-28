const express = require('express');
const router = express.Router();
const authController = require('../controller/auth_controller');
const { validateRequest } = require('../middleware/validation_middleware');
const { authenticateToken, requireVerified, refreshTokenIfNeeded } = require('../middleware/auth_middleware');
const authValidation = require('../validation/auth_validation');

// Public routes
router.post('/register', validateRequest(authValidation.registerSchema), authController.register);
router.post('/verify-email', validateRequest(authValidation.verifyEmailSchema), authController.verifyEmail);
router.post('/login', validateRequest(authValidation.loginSchema), authController.login);
router.post('/refresh-token', validateRequest(authValidation.refreshTokenSchema), authController.refreshToken);
router.post('/forgot-password', validateRequest(authValidation.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateRequest(authValidation.resetPasswordSchema), authController.resetPassword);
router.post('/resend-verification', validateRequest(authValidation.resendVerificationSchema), authController.resendVerification);

// Protected routes
router.use(authenticateToken); // All routes below this line require authentication
router.use(refreshTokenIfNeeded); // Refresh token if needed

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.post('/change-password', validateRequest(authValidation.changePasswordSchema), authController.changePassword);

module.exports = router;
