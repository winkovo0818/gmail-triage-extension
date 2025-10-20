// src/config.js
module.exports = {
  // 服务器配置
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS配置
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // LLM配置
  LLM_API_BASE: process.env.LLM_API_BASE || 'https://api.openai.com/v1',
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-4o-mini',
  
  // 缓存配置
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600', 10),
  
  // 数据库配置
  MONGODB_URI: process.env.MONGODB_URI || null,
  
  // 安全配置
  BACKEND_API_KEY: process.env.BACKEND_API_KEY || null,
  
  // 日志配置
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
