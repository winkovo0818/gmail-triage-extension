// src/middleware/validator.js
// 请求数据验证中间件
const Joi = require('joi');
const { AppError } = require('./errorHandler');

// 验证中间件工厂函数
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // 返回所有错误
      stripUnknown: true // 移除未知字段
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join('; ');
      
      return next(new AppError(errorMessage, 400));
    }

    // 用验证后的值替换请求体
    req.body = value;
    next();
  };
};

// 邮件分析请求验证schema
const analyzeSchema = Joi.object({
  subject: Joi.string().max(500).default(''),
  from: Joi.string().email().allow('').default('').messages({
    'string.email': 'Invalid email format for "from" field'
  }),
  to: Joi.string().email().allow('').default('').messages({
    'string.email': 'Invalid email format for "to" field'
  }),
  body: Joi.string().min(1).max(50000).required().messages({
    'string.empty': 'Email body cannot be empty',
    'string.max': 'Email body is too long (max 50000 characters)',
    'any.required': '"body" field is required'
  }),
  language: Joi.string().max(20).default('en')
});

// 回复草稿请求验证schema
const draftReplySchema = Joi.object({
  email: Joi.object({
    subject: Joi.string().max(500).default(''),
    from: Joi.string().email().allow('').default(''),
    to: Joi.string().email().allow('').default(''),
    body: Joi.string().min(1).max(50000).required(),
    language: Joi.string().max(20).default('en')
  }).required().messages({
    'any.required': '"email" object is required'
  }),
  intent: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Intent cannot be empty',
    'any.required': '"intent" field is required'
  }),
  tone: Joi.string().valid('concise', 'formal', 'friendly', 'professional', 'casual').default('concise'),
  max_chars: Joi.number().integer().min(100).max(5000).default(800)
});

module.exports = {
  validate,
  analyzeSchema,
  draftReplySchema
};
