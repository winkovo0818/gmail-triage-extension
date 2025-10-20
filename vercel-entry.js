/**
 * Vercel专用入口文件
 * 不启动HTTP服务器，只导出Express app
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// 导入配置
const config = require('./src/config');

// 导入中间件
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { ipFilter } = require('./src/middleware/ipFilter');
const { 
  notFoundHandler, 
  errorHandler
} = require('./src/middleware/errorHandler');

// 导入路由
const analyzeRouter = require('./src/routes/analyze');
const draftRouter = require('./src/routes/draft');

const app = express();

// 安全中间件
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// CORS配置
app.use(cors({
  origin: config.CORS_ORIGIN || '*',
  credentials: true
}));

// 请求体解析
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));

// IP黑名单过滤
app.use(ipFilter);

// 通用速率限制
app.use(generalLimiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    ts: Date.now(),
    version: '1.0.1',
    env: config.NODE_ENV
  });
});

// API路由
app.use('/analyze', analyzeRouter);
app.use('/draft', draftRouter);

// 根路径
app.get('/', (req, res) => {
  res.json({
    name: 'Mail Assistant API',
    version: '1.0.1',
    status: 'running',
    endpoints: {
      health: '/health',
      analyze: '/analyze',
      draft: '/draft'
    }
  });
});

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 导出Express应用
module.exports = app;
