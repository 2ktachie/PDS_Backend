// const express = require('express');
// const router = express.Router();
// const payslipController = require('../controllers/payslipController');
// const authMiddleware = require('../middlewares/authMiddleware');
// const multer = require('multer');

// // Configure Multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// const upload = multer({ storage: storage });

// // User routes
// router.get('/user/:user_id', authMiddleware.verifyToken, payslipController.getUserPayslips);

// // Admin routes
// router.post('/', authMiddleware.verifyToken, authMiddleware.checkRole(['admin']), payslipController.uploadSinglePayslip);
// router.post('/bulk/csv', authMiddleware.verifyToken, authMiddleware.checkRole(['admin']), upload.single('file'), payslipController.bulkUploadCSV);
// router.post('/bulk/excel', authMiddleware.verifyToken, authMiddleware.checkRole(['admin']), upload.single('file'), payslipController.bulkUploadExcel);
// router.get('/', authMiddleware.verifyToken, authMiddleware.checkRole(['admin']), payslipController.getAllPayslips);
// router.get('/:id', authMiddleware.verifyToken, authMiddleware.checkRole(['admin']), payslipController.getPayslipById);
// router.put('/:id', authMiddleware.verifyToken, authMiddleware.checkRole(['admin']), payslipController.updatePayslip);

// module.exports = router;