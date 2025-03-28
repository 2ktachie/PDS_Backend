const videoService = require('../services/video_service');

/**
 * Upload a new video
 */
const uploadVideo = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }
    
    // Extract metadata from the request body
    const metadata = {
      title: req.body.title || req.file.originalname,
      description: req.body.description || ''
    };
    
    // Process the video file
    const result = await videoService.uploadVideo(req.file, req.user, metadata);
    
    return res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: result.video
    });
  } catch (error) {
    console.error('Video upload error:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error uploading video: ${error.message}`
    });
  }
};

/**
 * Get all videos
 */
const getVideos = async (req, res) => {
  try {
    const activeOnly = req.query.active_only !== 'false';
    const result = await videoService.getVideos({ active_only: activeOnly });
    
    return res.status(200).json({
      success: true,
      videos: result.videos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error fetching videos: ${error.message}`
    });
  }
};

/**
 * Get a specific video by ID
 */
const getVideoById = async (req, res) => {
  try {
    const videoId = req.params.id;
    const result = await videoService.getVideoById(videoId);
    
    return res.status(200).json({
      success: true,
      video: result.video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error fetching video: ${error.message}`
    });
  }
};

/**
 * Update a video
 */
const updateVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const updates = {
      title: req.body.title,
      description: req.body.description,
      is_active: req.body.is_active
    };
    
    const result = await videoService.updateVideo(videoId, updates, req.user);
    
    return res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      video: result.video
    });
  } catch (error) {
    console.error('Error updating video:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error updating video: ${error.message}`
    });
  }
};

/**
 * Delete a video
 */
const deleteVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const result = await videoService.deleteVideo(videoId, req.user);
    
    return res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error deleting video: ${error.message}`
    });
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo
}; 