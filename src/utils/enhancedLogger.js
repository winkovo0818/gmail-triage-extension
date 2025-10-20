// src/utils/enhancedLogger.js
// 增强的日志系统，使用Winston
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

// 自定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 控制台输出格式（更友好）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// 创建日志传输器
const transports = [];

// 控制台输出
if (config.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.LOG_LEVEL || 'info'
    })
  );
}

// 文件输出 - 所有日志
transports.push(
  new DailyRotateFile({
    filename: path.join('logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // 保留14天
    format: logFormat,
    level: 'info'
  })
);

// 文件输出 - 错误日志
transports.push(
  new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // 保留30天
    format: logFormat,
    level: 'error'
  })
);

// 创建logger实例
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  format: logFormat,
  transports: transports,
  exitOnError: false
});

// 包装函数，保持与旧logger的兼容性
const log = (level, msg, meta = {}) => {
  if (['error', 'warn', 'info', 'debug'].includes(level)) {
    logger.log(level, msg, meta);
  }
};

// 导出logger和兼容函数
module.exports = {
  logger,
  log
};
