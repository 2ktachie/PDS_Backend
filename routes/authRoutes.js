const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getUsers,
  getUserById,
  getAllUsers,
  getCurrentUser,
  updateProfile,
  updateUserStatus,
  resetPassword,
  forgotPassword,
  changePassword,
  importFromExcel,
  importFromCSV
} = require('../controller/authController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// Public Routes (no authentication required)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected Routes (require authentication)
router.use(authMiddleware.verifyToken);

// User Profile Routes
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);

// Bulk Import Routes (admin only)
router.post('/import/csv', authMiddleware.checkRole(['ADMIN']), upload.single('file'), importFromCSV);
router.post('/import/excel', authMiddleware.checkRole(['ADMIN']), upload.single('file'), importFromExcel);

// Admin User Management Routes
router.get('/users', authMiddleware.checkRole(['ADMIN', 'HR']), getUsers);
router.get('/users/all', authMiddleware.checkRole(['ADMIN']), getAllUsers);
router.get('/users/:id', authMiddleware.checkRole(['ADMIN', 'HR']), getUserById);
router.put('/users/:id/status', authMiddleware.checkRole(['ADMIN']), updateUserStatus);

module.exports = router;