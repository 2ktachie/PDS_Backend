const fileUploadService = require('../services/file_upload_service');
const fs = require('fs');
const path = require('path');

/**
 * Upload and process a CSV file
 */
const uploadCsv = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) { return res.status(400).json({success: false, message: 'No file uploaded'});}
    
    // Extract metadata from the request body
    const metadata = {
      report_date: req.body.report_date,
      report_time: req.body.report_time,
      description: req.body.description
    };
    
    // Process the CSV file
    const result = await fileUploadService.processCsvFile(req.file, req.user, metadata);
    
    return res.status(200).json({
      success: true,
      message: 'File uploaded and processed successfully',
      data: result
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Clean up the uploaded file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => { if (err) console.error('Error deleting file:', err); });}
    
    return res.status(500).json({ success: false, message: `Error processing CSV file: ${error.message}`});
  }
};

/**
 * Cancel/undo an upload
 */
const cancelUpload = async (req, res) => {
  try {
    const { upload_id } = req.params;
    
    // Cancel the upload
    const result = await fileUploadService.cancelUpload(parseInt(upload_id, 10), req.user);
    
    return res.status(200).json({
      success: true,
      message: 'Upload cancelled successfully',
      data: result
    });
  } catch (error) {
    console.error('Cancel upload error:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error cancelling upload: ${error.message}`
    });
  }
};

/**
 * Get a list of all uploads
 */
const getUploads = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    
    // Get uploads with pagination
    const result = await fileUploadService.getUploads({
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 10,
      status
    });
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get uploads error:', error);
    
    return res.status(500).json({ success: false, message: `Error fetching uploads: ${error.message}`});
  }
};

/**
 * Get details of a specific upload
 */
const getUploadDetails = async (req, res) => {
  try {
    const { upload_id } = req.params;
    
    // Get upload details
    const result = await fileUploadService.getUploadDetails(parseInt(upload_id, 10));
    
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get upload details error:', error);
    
    return res.status(500).json({success: false, message: `Error fetching upload details: ${error.message}`});
  }
};

module.exports = {
  uploadCsv,
  cancelUpload,
  getUploads,
  getUploadDetails
};
