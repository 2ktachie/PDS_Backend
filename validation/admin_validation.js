const Joi = require('joi');

const uploadCsvSchema = Joi.object({
  // Date for which the data is being reported (required)
  report_date: Joi.date().required(),
  
  // Time of the report (required, format HH:MM)
  report_time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    'string.pattern.base': 'Report time must be in HH:MM format (24-hour)'
  }),
  
  // Optional description
  description: Joi.string().max(255),
  
  // File will be handled by multer middleware, not by Joi
});

const cancelUploadSchema = Joi.object({
  upload_id: Joi.number().integer().required()
});

module.exports = {
  uploadCsvSchema,
  cancelUploadSchema
};
