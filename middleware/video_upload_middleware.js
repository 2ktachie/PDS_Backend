const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure videos directory exists
const videosDir = path.join(__dirname, '../uploads/videos');
if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Configure storage
const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, videosDir);
  },
  filename: function (req, file, cb) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileExt = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, fileExt);
    cb(null, `video_${timestamp}_${fileName}${fileExt}`);
  }
});

// File filter to only accept video files
const videoFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (MP4, WebM, OGG, QuickTime) are allowed'), false);
  }
};

// Configure multer for video uploads
const videoUpload = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// Handle upload errors
const handleVideoUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 100MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  videoUpload,
  handleVideoUploadErrors
};
