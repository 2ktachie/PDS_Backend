const displaySettingsService = require('../services/display_settings');

/**
 * Initialize default display settings
 */
const initializeSettings = async (req, res) => {
  try {
    const result = await displaySettingsService.initializeDefaultSettings(req.user);
    
    return res.status(200).json({
      success: true,
      message: 'Display settings initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing display settings:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error initializing display settings: ${error.message}`
    });
  }
};

/**
 * Get all display settings
 */
const getAllSettings = async (req, res) => {
  try {
    const result = await displaySettingsService.getAllSettings();
    
    return res.status(200).json({
      success: true,
      settings: result.settings
    });
  } catch (error) {
    console.error('Error fetching display settings:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error fetching display settings: ${error.message}`
    });
  }
};

/**
 * Update a display setting
 */
const updateSetting = async (req, res) => {
  try {
    const { setting_name, value } = req.body;
    
    if (!setting_name || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Setting name and value are required'
      });
    }
    
    const result = await displaySettingsService.updateSetting(setting_name, value, req.user);
    
    return res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      setting: result.setting
    });
  } catch (error) {
    console.error('Error updating display setting:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error updating display setting: ${error.message}`
    });
  }
};

module.exports = {
  initializeSettings,
  getAllSettings,
  updateSetting
}; 