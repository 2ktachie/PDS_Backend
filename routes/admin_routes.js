const express = require('express');
const router = express.Router();
const adminController = require('../controller/admin_controller');
const videoController = require('../controller/video_controller');
const displaySettingsController = require('../controller/display_settings_controller');
const metricsController = require('../controller/metrics_controller');
const { validateRequest } = require('../middleware/validation_middleware');
const adminValidation = require('../validation/admin_validation');
const { authenticateToken, requireAdmin } = require('../middleware/auth_middleware');
const { upload, handleUploadErrors } = require('../middleware/upload_middleware');
const { videoUpload, handleVideoUploadErrors } = require('../middleware/video_upload_middleware');

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// CSV upload routes
router.post('/calls/upload', upload.single('file'), handleUploadErrors, validateRequest(adminValidation.uploadCsvSchema), adminController.uploadCsv);
router.get('/calls/uploads', adminController.getUploads);
router.get('/calls/uploads/:id', adminController.getUploadDetails);
router.post('/calls/uploads/:id/cancel', adminController.cancelUpload);

// Video management routes
router.post('/videos/upload', videoUpload.single('file'), handleVideoUploadErrors, videoController.uploadVideo);
router.get('/videos', videoController.getVideos);
router.get('/videos/:id', videoController.getVideoById);
router.put('/videos/:id', videoController.updateVideo);
router.delete('/videos/:id', videoController.deleteVideo);

// Display settings routes
router.post('/display/initialize', displaySettingsController.initializeSettings);
router.get('/display/settings', displaySettingsController.getAllSettings);
router.put('/display/settings', displaySettingsController.updateSetting);

// Enhanced metrics routes
router.get('/metrics/filtered', metricsController.getFilteredCalls);
router.get('/metrics/performers', metricsController.getPerformers);

module.exports = router;
