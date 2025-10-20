// src/config/database.js
// 数据库连接配置
const mongoose = require('mongoose');
const { log } = require('../utils/enhancedLogger');
const config = require('../config');

// MongoDB连接选项
const options = {
  // useNewUrlParser: true, // 已弃用，mongoose 6+默认使用新解析器
  // useUnifiedTopology: true, // 已弃用，mongoose 6+默认使用
  maxPoolSize: 10, // 最大连接池大小
  minPoolSize: 2, // 最小连接池大小
  socketTimeoutMS: 45000, // Socket超时时间
  serverSelectionTimeoutMS: 5000, // 服务器选择超时
  family: 4 // 使用IPv4
};

// 连接数据库
const connectDatabase = async () => {
  try {
    if (!config.MONGODB_URI) {
      log('warn', 'MongoDB URI not configured, skipping database connection');
      return null;
    }

    const conn = await mongoose.connect(config.MONGODB_URI, options);
    
    log('info', 'MongoDB connected successfully', {
      host: conn.connection.host,
      database: conn.connection.name
    });

    // 监听连接事件
    mongoose.connection.on('error', (err) => {
      log('error', 'MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      log('warn', 'MongoDB disconnected');
    });

    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      log('info', 'MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    log('error', 'Failed to connect to MongoDB', {
      error: error.message,
      stack: error.stack
    });
    
    // 在生产环境中，数据库连接失败可能需要退出进程
    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    return null;
  }
};

// 断开数据库连接
const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    log('info', 'MongoDB connection closed');
  } catch (error) {
    log('error', 'Error closing MongoDB connection', {
      error: error.message
    });
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase
};
