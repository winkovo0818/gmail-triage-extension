// src/middleware/rateLimiter.js
// 请求速率限制中间件
const rateLimit = require('express-rate-limit');
const { log } = require('../utils/logger');

// 通用速率限制器：每15分钟最多100个请求
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制请求数
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true, // 返回 RateLimit-* 头部
  legacyHeaders: false, // 禁用 X-RateLimit-* 头部
  handler: (req, res) => {
    log('warn', 'Rate limit exceeded', { 
      ip: req.ip, 
      path: req.path 
    });
    res.status(429).json({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

// LLM API调用的严格限制器：每分钟最多10个请求
const llmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 10, // 限制10个请求
  message: {
    error: 'Too many LLM requests, please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log('warn', 'LLM rate limit exceeded', { 
      ip: req.ip, 
      path: req.path 
    });
    res.status(429).json({
      error: 'Too many LLM requests',
      message: 'You have exceeded the LLM API rate limit. Please try again later.',
      retryAfter: '1 minute'
    });
  }
});

module.exports = {
  generalLimiter,
  llmLimiter
};
