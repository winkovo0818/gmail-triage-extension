/**
 * 邮件智能助手 - 后端服务器主入口
 * 
 * @author 云淡风轻
 * @license MIT
 * @version 1.0.0
 * @copyright 2025 云淡风轻
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// 导入配置
const config = require('./config');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// 导入中间件
const { generalLimiter } = require('./middleware/rateLimiter');
const { 
  notFoundHandler, 
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException 
} = require('./middleware/errorHandler');

// 导入日志
const { log, logger } = require('./utils/enhancedLogger');

// 导入路由
const analyzeRouter = require('./routes/analyze');
const draftRouter = require('./routes/draft');

// 处理未捕获的异常和Promise拒绝
handleUncaughtException();
handleUnhandledRejection();

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

// 开发环境日志
if (config.NODE_ENV !== 'production') {
  const morgan = require('morgan');
  app.use(morgan('dev', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// 通用速率限制
app.use(generalLimiter);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: 健康检查
 *     description: 检查服务器运行状态
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: 服务器正常运行
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 ts:
 *                   type: integer
 *                   example: 1697798400000
 *                 version:
 *                   type: string
 *                   example: '0.2.0'
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 */
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    ts: Date.now(),
    version: '0.2.0',
    uptime: process.uptime()
  });
});

// API文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Mail Assistant API',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// 简单的API密钥检查（用于扩展/后端，可选）
app.use((req, res, next) => {
  const apiKey = config.BACKEND_API_KEY;
  if (!apiKey) return next(); // 不强制执行
  const incoming = req.get('x-api-key') || req.query.api_key;
  if (!incoming || incoming !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// API路由
app.use('/analyze', analyzeRouter);
app.use('/draft_reply', draftRouter);

// 404处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    const port = config.PORT || 3000;
    const server = app.listen(port, () => {
      log('info', `Mail Assistant backend listening on port ${port}`);
      log('info', `Environment: ${config.NODE_ENV}`);
      log('info', `API Documentation: http://localhost:${port}/api-docs`);
    });

    // 优雅关闭
    const gracefulShutdown = (signal) => {
      log('info', `${signal} received, closing server gracefully`);
      server.close(() => {
        log('info', 'Server closed');
        process.exit(0);
      });

      // 如果10秒后还没关闭，强制退出
      setTimeout(() => {
        log('error', 'Forcing shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    log('error', 'Failed to start server', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
};

// 仅在直接运行时启动服务器（便于测试）
if (require.main === module) {
  startServer();
}

module.exports = app;
