const db = require('../models');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

/**
 * Upload a new video
 * @param {Object} fileInfo - Information about the uploaded file
 * @param {Object} user - User who uploaded the file
 * @param {Object} metadata - Additional metadata for the video
 * @returns {Promise<Object>} - Uploaded video information
 */
const uploadVideo = async (fileInfo, user, metadata) => {
  const { title, description } = metadata;
  
  try {
    // Create video record in database
    const video = await db.videos.create({
      title,
      description,
      file_path: fileInfo.path,
      file_size: fileInfo.size,
      mime_type: fileInfo.mimetype,
      uploaded_by: user.user_id,
      is_active: true
    });
    
    // Log the action in audit trail
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'UPLOAD_VIDEO',
      description: `Uploaded video: ${title}`
    });
    
    return {
      success: true,
      message: 'Video uploaded successfully',
      video
    };
  } catch (error) {
    // If there's an error, delete the uploaded file
    if (fileInfo.path && fs.existsSync(fileInfo.path)) {
      await unlinkAsync(fileInfo.path);
    }
    
    console.error('Error uploading video:', error);
    throw error;
  }
};

/**
 * Get all videos
 * @param {Object} options - Filter options
 * @returns {Promise<Object>} - List of videos
 */
const getVideos = async (options = {}) => {
  const { active_only = true } = options;
  
  try {
    const whereClause = {};
    if (active_only) {
      whereClause.is_active = true;
    }
    
    const videos = await db.videos.findAll({
      where: whereClause,
      include: [{
        model: db.Users,
        as: 'uploader',
        attributes: ['email', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']]
    });
    
    return {
      success: true,
      videos
    };
  } catch (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }
};

/**
 * Get a specific video by ID
 * @param {number} videoId - ID of the video
 * @returns {Promise<Object>} - Video details
 */
const getVideoById = async (videoId) => {
  try {
    const video = await db.videos.findByPk(videoId, {
      include: [{
        model: db.Users,
        as: 'uploader',
        attributes: ['email', 'first_name', 'last_name']
      }]
    });
    
    if (!video) {
      throw new Error('Video not found');
    }
    
    return {
      success: true,
      video
    };
  } catch (error) {
    console.error('Error fetching video:', error);
    throw error;
  }
};

/**
 * Update a video
 * @param {number} videoId - ID of the video to update
 * @param {Object} updates - Fields to update
 * @param {Object} user - User making the update
 * @returns {Promise<Object>} - Updated video
 */
const updateVideo = async (videoId, updates, user) => {
  try {
    const video = await db.videos.findByPk(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }
    
    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'is_active'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
    await video.update(updateData);
    
    // Log the action in audit trail
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'UPDATE_VIDEO',
      description: `Updated video: ${video.title} (ID: ${videoId})`
    });
    
    return {
      success: true,
      message: 'Video updated successfully',
      video
    };
  } catch (error) {
    console.error('Error updating video:', error);
    throw error;
  }
};

/**
 * Delete a video
 * @param {number} videoId - ID of the video to delete
 * @param {Object} user - User performing the deletion
 * @returns {Promise<Object>} - Result of the deletion
 */
const deleteVideo = async (videoId, user) => {
  try {
    const video = await db.videos.findByPk(videoId);
    
    if (!video) {
      throw new Error('Video not found');
    }
    
    // Get the file path before deleting the record
    const filePath = video.file_path;
    
    // Delete the database record
    await video.destroy();
    
    // Delete the file from disk
    if (filePath && fs.existsSync(filePath)) {
      await unlinkAsync(filePath);
    }
    
    // Log the action in audit trail
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'DELETE_VIDEO',
      description: `Deleted video: ${video.title} (ID: ${videoId})`
    });
    
    return {
      success: true,
      message: 'Video deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};

module.exports = {
  uploadVideo,
  getVideos,
  getVideoById,
  updateVideo,
  deleteVideo
};
