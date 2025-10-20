/**
 * 邮件智能助手 - IP过滤和黑名单
 * 
 * @author 云淡风轻
 * @license MIT
 * @copyright 2025 云淡风轻
 */

const { log } = require('../utils/enhancedLogger');
const { AppError } = require('./errorHandler');

// IP黑名单（可以从数据库或Redis加载）
const IP_BLACKLIST = new Set();

// IP白名单（如果启用，只允许白名单IP访问）
const IP_WHITELIST = new Set();

// 滥用记录（IP -> {count, firstSeen, lastSeen}）
const ABUSE_RECORDS = new Map();

// 配置
const CONFIG = {
  enableWhitelist: false,          // 是否启用白名单模式
  abuseThreshold: 50,              // 滥用阈值（1小时内）
  abuseWindowMs: 60 * 60 * 1000,   // 1小时
  autoBlacklistEnabled: true        // 自动加入黑名单
};

/**
 * IP黑名单检查中间件
 */
const ipFilter = (req, res, next) => {
  const clientIp = getClientIp(req);
  
  // 1. 检查黑名单
  if (IP_BLACKLIST.has(clientIp)) {
    log('warn', 'Blacklisted IP attempt', { ip: clientIp, path: req.path });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Your IP address has been blocked due to suspicious activity.'
    });
  }
  
  // 2. 白名单模式（如果启用）
  if (CONFIG.enableWhitelist && !IP_WHITELIST.has(clientIp)) {
    log('warn', 'Non-whitelisted IP attempt', { ip: clientIp });
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access restricted.'
    });
  }
  
  // 3. 记录访问（用于检测滥用）
  recordAccess(clientIp);
  
  // 4. 检查是否滥用
  if (isAbusing(clientIp)) {
    log('warn', 'IP abuse detected', { 
      ip: clientIp,
      record: ABUSE_RECORDS.get(clientIp)
    });
    
    // 自动加入黑名单
    if (CONFIG.autoBlacklistEnabled) {
      addToBlacklist(clientIp, 'Automatic - abuse detected');
    }
    
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Your IP has been temporarily blocked due to excessive requests.'
    });
  }
  
  next();
};

/**
 * 获取客户端真实IP
 */
function getClientIp(req) {
  // 优先从代理头获取
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

/**
 * 记录IP访问
 */
function recordAccess(ip) {
  const now = Date.now();
  
  if (!ABUSE_RECORDS.has(ip)) {
    ABUSE_RECORDS.set(ip, {
      count: 1,
      firstSeen: now,
      lastSeen: now
    });
  } else {
    const record = ABUSE_RECORDS.get(ip);
    
    // 如果超过时间窗口，重置计数
    if (now - record.firstSeen > CONFIG.abuseWindowMs) {
      record.count = 1;
      record.firstSeen = now;
    } else {
      record.count++;
    }
    
    record.lastSeen = now;
  }
}

/**
 * 检查IP是否滥用
 */
function isAbusing(ip) {
  const record = ABUSE_RECORDS.get(ip);
  if (!record) return false;
  
  const now = Date.now();
  
  // 在时间窗口内超过阈值
  if (now - record.firstSeen <= CONFIG.abuseWindowMs) {
    return record.count > CONFIG.abuseThreshold;
  }
  
  return false;
}

/**
 * 添加到黑名单
 */
function addToBlacklist(ip, reason = 'Manual') {
  IP_BLACKLIST.add(ip);
  log('warn', 'IP added to blacklist', { ip, reason });
}

/**
 * 从黑名单移除
 */
function removeFromBlacklist(ip) {
  IP_BLACKLIST.delete(ip);
  log('info', 'IP removed from blacklist', { ip });
}

/**
 * 添加到白名单
 */
function addToWhitelist(ip) {
  IP_WHITELIST.add(ip);
  log('info', 'IP added to whitelist', { ip });
}

/**
 * 从白名单移除
 */
function removeFromWhitelist(ip) {
  IP_WHITELIST.delete(ip);
  log('info', 'IP removed from whitelist', { ip });
}

/**
 * 获取黑名单列表
 */
function getBlacklist() {
  return Array.from(IP_BLACKLIST);
}

/**
 * 获取滥用记录
 */
function getAbuseRecords() {
  return Array.from(ABUSE_RECORDS.entries()).map(([ip, record]) => ({
    ip,
    ...record
  }));
}

/**
 * 清理过期的滥用记录（定期执行）
 */
function cleanupAbuseRecords() {
  const now = Date.now();
  const expired = [];
  
  for (const [ip, record] of ABUSE_RECORDS.entries()) {
    if (now - record.lastSeen > CONFIG.abuseWindowMs * 2) {
      expired.push(ip);
    }
  }
  
  expired.forEach(ip => ABUSE_RECORDS.delete(ip));
  
  if (expired.length > 0) {
    log('info', 'Cleaned up abuse records', { count: expired.length });
  }
}

// 每小时清理一次过期记录
setInterval(cleanupAbuseRecords, 60 * 60 * 1000);

module.exports = {
  ipFilter,
  getClientIp,
  addToBlacklist,
  removeFromBlacklist,
  addToWhitelist,
  removeFromWhitelist,
  getBlacklist,
  getAbuseRecords,
  CONFIG
};
