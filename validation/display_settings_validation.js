const Joi = require('joi');

const updateSettingSchema = Joi.object({
  setting_name: Joi.string().required(),
  value: Joi.alternatives().try(
    Joi.string(),
    Joi.number(),
    Joi.boolean(),
    Joi.object()
  ).required()
});

module.exports = {
  updateSettingSchema
}; 