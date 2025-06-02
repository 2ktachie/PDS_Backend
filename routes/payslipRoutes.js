const express = require('express');
const router = express.Router();
const {
    addSinglePayslip,
    importPayslipsCSV,
    importPayslipsExcel,
    getUserPayslips,
    getAllPayslips,
    getPayslipById,
    updatePayslip,
    deletePayslip
} = require('../controller/payslipController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

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

// Protected routes (require authentication)
router.use(authMiddleware.verifyToken);

// Payslip routes
router.post('/', authMiddleware.checkRole(['HR', 'ADMIN']), addSinglePayslip);
router.post('/import/csv', authMiddleware.checkRole(['HR', 'ADMIN']), upload.single('file'), importPayslipsCSV);
router.post('/import/excel', authMiddleware.checkRole(['HR', 'ADMIN']), upload.single('file'), importPayslipsExcel);

// User-specific routes
router.get('/user/:user_id', getUserPayslips);

// Admin/HR routes
router.get('/all', authMiddleware.checkRole(['HR', 'ADMIN']), getAllPayslips);
router.get('/:id', authMiddleware.checkRole(['HR', 'ADMIN']), getPayslipById);
router.put('/:id', authMiddleware.checkRole(['HR', 'ADMIN']), updatePayslip);
router.delete('/:id', authMiddleware.checkRole(['ADMIN']), deletePayslip);

module.exports = router;