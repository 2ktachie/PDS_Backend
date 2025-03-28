const db = require('../models');

/**
 * Initialize default display settings
 * @param {Object} user - Admin user creating the settings
 * @returns {Promise<Object>} - Result of initialization
 */
const initializeDefaultSettings = async (user) => {
  try {
    const defaultSettings = [
      {
        setting_name: 'video_display_duration',
        display_name: 'Video Display Duration',
        setting_value: '300', // 5 minutes in seconds
        setting_type: 'number',
        description: 'Duration in seconds to display videos before showing metrics',
        updated_by: user.user_id
      },
      {
        setting_name: 'metrics_display_duration',
        display_name: 'Metrics Display Duration',
        setting_value: '60', // 1 minute in seconds
        setting_type: 'number',
        description: 'Duration in seconds to display metrics before returning to videos',
        updated_by: user.user_id
      },
      {
        setting_name: 'top_performers_count',
        display_name: 'Top Performers Count',
        setting_value: '5',
        setting_type: 'number',
        description: 'Number of top performers to display in leaderboards',
        updated_by: user.user_id
      },
      {
        setting_name: 'bottom_performers_count',
        display_name: 'Bottom Performers Count',
        setting_value: '5',
        setting_type: 'number',
        description: 'Number of bottom performers to display in leaderboards',
        updated_by: user.user_id
      },
      {
        setting_name: 'display_configuration',
        display_name: 'Display Configuration',
        setting_value: JSON.stringify({
          showTopPerformers: true,
          showBottomPerformers: true,
          showDepartmentFilters: true,
          showAgentTypeFilters: true,
          primaryMetric: 'total', // 'inbound', 'outbound', or 'total'
          refreshInterval: 60, // seconds
          theme: 'default'
        }),
        setting_type: 'json',
        description: 'Configuration for the display interface',
        updated_by: user.user_id
      }
    ];
    
    // Create settings if they don't exist
    for (const setting of defaultSettings) {
      await db.display_settings.findOrCreate({
        where: { setting_name: setting.setting_name },
        defaults: setting
      });
    }
    
    return {
      success: true,
      message: 'Default display settings initialized'
    };
  } catch (error) {
    console.error('Error initializing default settings:', error);
    throw error;
  }
};

/**
 * Get all display settings
 * @returns {Promise<Object>} - All display settings
 */
const getAllSettings = async () => {
  try {
    const settings = await db.display_settings.findAll({
      include: [{
        model: db.Users,
        as: 'last_updated_by',
        attributes: ['email', 'first_name', 'last_name']
      }],
      order: [['setting_name', 'ASC']]
    });
    
    // Parse JSON values
    const formattedSettings = settings.map(setting => {
      const result = setting.toJSON();
      if (setting.setting_type === 'json') {
        try {
          result.parsed_value = JSON.parse(setting.setting_value);
        } catch (e) {
          result.parsed_value = null;
        }
      }
      return result;
    });
    
    return {
      success: true,
      settings: formattedSettings
    };
  } catch (error) {
    console.error('Error fetching display settings:', error);
    throw error;
  }
};

/**
 * Update a display setting
 * @param {string} settingName - Name of the setting to update
 * @param {*} value - New value for the setting
 * @param {Object} user - User making the update
 * @returns {Promise<Object>} - Updated setting
 */
const updateSetting = async (settingName, value, user) => {
  try {
    const setting = await db.display_settings.findOne({
      where: { setting_name: settingName }
    });
    
    if (!setting) {
      throw new Error(`Setting '${settingName}' not found`);
    }
    
    // Format the value based on setting type
    let formattedValue = value;
    if (setting.setting_type === 'json' && typeof value !== 'string') {
      formattedValue = JSON.stringify(value);
    }
    
    // Update the setting
    await setting.update({
      setting_value: formattedValue,
      updated_by: user.user_id
    });
    
    // Log the action in audit trail
    await db.audit_trail.create({
      email: user.email,
      user_id: user.user_id,
      action: 'UPDATE_DISPLAY_SETTING',
      description: `Updated display setting: ${setting.display_name}`
    });
    
    return {
      success: true,
      message: 'Setting updated successfully',
      setting
    };
  } catch (error) {
    console.error('Error updating display setting:', error);
    throw error;
  }
};

module.exports = {
  initializeDefaultSettings,
  getAllSettings,
  updateSetting
};
