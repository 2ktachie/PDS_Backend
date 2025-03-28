const Joi = require("joi");

// Registration validation schema
const registerSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  last_name: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[\]:;<>,.?\/~_+-=|\\]).{8,32}$/))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 1 digit, 1 lowercase, 1 uppercase, 1 special character and be 8-32 characters long',
      'any.required': 'Password is required'
    }),
  
  phone_number: Joi.string().required()
    .messages({
      'any.required': 'Phone number is required'
    })
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string().required()
    .messages({
      'any.required': 'Password is required'
    }),
    
  remember_me: Joi.boolean().default(false)
});

// Email verification validation schema
const verifyEmailSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'any.required': 'Verification token is required'
    })
});

// Password reset request validation schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

// Password reset validation schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  
  password: Joi.string()
    .pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[\]:;<>,.?\/~_+-=|\\]).{8,32}$/))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 1 digit, 1 lowercase, 1 uppercase, 1 special character and be 8-32 characters long',
      'any.required': 'Password is required'
    }),
  
  confirm_password: Joi.string().valid(Joi.ref('password')).required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

// Change password validation schema
const changePasswordSchema = Joi.object({
  current_password: Joi.string().required()
    .messages({
      'any.required': 'Current password is required'
    }),
  
  new_password: Joi.string()
    .pattern(new RegExp(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&(){}[\]:;<>,.?\/~_+-=|\\]).{8,32}$/))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least 1 digit, 1 lowercase, 1 uppercase, 1 special character and be 8-32 characters long',
      'any.required': 'New password is required'
    }),
  
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

// Refresh token validation schema
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

// Add this to your existing validation schemas
const resendVerificationSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  refreshTokenSchema,
  resendVerificationSchema
};
