/**
 * 邮件智能助手 - 内容过滤中间件
 * 防止违禁词、恶意内容和超长请求
 * 
 * @author 云淡风轻
 * @license MIT
 * @copyright 2025 云淡风轻
 */

const { log } = require('../utils/enhancedLogger');
const { AppError } = require('./errorHandler');

/**
 * 检测可疑的注入攻击
 */
function detectInjectionAttempt(text) {
  if (!text) return false;
  
  const injectionPatterns = [
    /<script[^>]*>.*?<\/script>/gi,  // XSS
    /javascript:/gi,                   // javascript协议
    /on\w+\s*=/gi,                     // 事件处理器
    /\$\{.*?\}/g,                      // 模板注入
    /eval\s*\(/gi,                     // eval函数
    /<!--.*?-->/g,                     // HTML注释
  ];
  
  return injectionPatterns.some(pattern => pattern.test(text));
}

/**
 * 内容过滤中间件
 */
const contentFilter = (req, res, next) => {
  try {
    const { body, subject } = req.body;
    
    // 1. 检查请求体大小（已在express.json中限制，这里是二次确认）
    const bodySize = JSON.stringify(req.body).length;
    if (bodySize > 500 * 1024) { // 500KB
      log('warn', 'Request body too large', { 
        ip: req.ip, 
        size: bodySize 
      });
      throw new AppError('Request body is too large. Maximum 500KB allowed.', 413);
    }
    
    // 2. 检查注入攻击
    if (detectInjectionAttempt(`${subject} ${body}`)) {
      log('error', 'Possible injection attempt detected', { 
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent')
      });
      throw new AppError('Invalid request format detected.', 400);
    }
    
    // 3. 检查字段长度
    if (subject && subject.length > 500) {
      throw new AppError('Subject is too long. Maximum 500 characters allowed.', 400);
    }
    
    if (body && body.length > 50000) {
      throw new AppError('Email body is too long. Maximum 50000 characters allowed.', 400);
    }
    
    // 通过所有检查
    next();
    
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      log('error', 'Content filter error', { 
        error: error.message 
      });
      next(new AppError('Content validation failed', 500));
    }
  }
};

module.exports = {
  contentFilter,
  detectInjectionAttempt
};
