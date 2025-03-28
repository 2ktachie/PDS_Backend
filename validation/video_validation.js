const Joi = require('joi');

const uploadVideoSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow('', null)
});

const updateVideoSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow('', null),
  is_active: Joi.boolean()
}).min(1);

module.exports = {
  uploadVideoSchema,
  updateVideoSchema
}; 