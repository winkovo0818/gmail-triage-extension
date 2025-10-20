/**
 * Vercel Serverless Function 入口
 * 导出Express应用供Vercel使用
 */

const app = require('../src/server');

module.exports = app;
