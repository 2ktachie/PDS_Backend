const express = require('express');
const router = express.Router();
const metricsController = require('../controller/metrics_controller');
const displaySettingsController = require('../controller/display_settings_controller');
const videoController = require('../controller/video_controller');

// Public routes for display screens - no authentication required

// Get display settings
router.get('/settings', displaySettingsController.getAllSettings);

// Get active videos
router.get('/videos', (req, res, next) => {
  req.query.active_only = 'true';
  next();
}, videoController.getVideos);

// Get performers for leaderboards
router.get('/performers', metricsController.getPerformers);

// Get filtered calls
router.get('/metrics', metricsController.getFilteredCalls);

module.exports = router; 