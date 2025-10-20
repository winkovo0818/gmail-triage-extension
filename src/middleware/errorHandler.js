// src/middleware/errorHandler.js
// 统一错误处理中间件
const { log } = require('../utils/logger');

// 自定义错误类
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 错误处理
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.originalUrl} on this server`,
    404
  );
  next(error);
};

// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // 记录错误日志
  if (err.statusCode >= 500) {
    log('error', 'Server error occurred', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      body: req.body
    });
  } else {
    log('warn', 'Client error occurred', {
      message: err.message,
      statusCode: err.statusCode,
      url: req.originalUrl,
      method: req.method
    });
  }

  // 开发环境返回详细错误信息
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      stack: err.stack,
      error: err
    });
  }

  // 生产环境返回简化错误信息
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message
    });
  }

  // 编程或未知错误：不泄露错误详情
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong, please try again later'
  });
};

// 处理未捕获的Promise拒绝
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    log('error', 'Unhandled Rejection', {
      reason: reason,
      promise: promise
    });
    // 在生产环境中，你可能想要优雅地关闭服务器
    // process.exit(1);
  });
};

// 处理未捕获的异常
const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    log('error', 'Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });
    // 未捕获的异常很严重，应该退出进程
    process.exit(1);
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
  handleUnhandledRejection,
  handleUncaughtException
};
