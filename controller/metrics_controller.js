const fileUploadService = require('../services/file_upload_service');

/**
 * Get filtered calls data for leaderboards
 */
const getFilteredCalls = async (req, res) => {
  try {
    const options = {
      department_id: req.query.department_id ? parseInt(req.query.department_id, 10) : undefined,
      agent_type_id: req.query.agent_type_id ? parseInt(req.query.agent_type_id, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 10,
      top: req.query.top !== 'false', // Default to top performers
      sort_by: req.query.sort_by || 'total' // Default to total calls
    };
    
    const result = await fileUploadService.getFilteredCalls(options);
    
    return res.status(200).json({
      success: true,
      report_date: result.report_date,
      report_time: result.report_time,
      calls: result.calls,
      filters: result.filters
    });
  } catch (error) {
    console.error('Error fetching filtered calls:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error fetching filtered calls: ${error.message}`
    });
  }
};

/**
 * Get both top and bottom performers in a single request
 */
const getPerformers = async (req, res) => {
  try {
    const options = {
      department_id: req.query.department_id ? parseInt(req.query.department_id, 10) : undefined,
      agent_type_id: req.query.agent_type_id ? parseInt(req.query.agent_type_id, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 5,
      sort_by: req.query.sort_by || 'total'
    };
    
    // Get top performers
    const topOptions = { ...options, top: true };
    const topResult = await fileUploadService.getFilteredCalls(topOptions);
    
    // Get bottom performers
    const bottomOptions = { ...options, top: false };
    const bottomResult = await fileUploadService.getFilteredCalls(bottomOptions);
    
    return res.status(200).json({
      success: true,
      report_date: topResult.report_date,
      report_time: topResult.report_time,
      top_performers: topResult.calls,
      bottom_performers: bottomResult.calls,
      filters: options
    });
  } catch (error) {
    console.error('Error fetching performers:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error fetching performers: ${error.message}`
    });
  }
};

module.exports = {
  getFilteredCalls,
  getPerformers
}; 