// src/utils/logger.js
const config = require('../config');
function log(level, msg, meta) {
  if (['error','warn','info','debug'].includes(level)) {
    if (level === 'debug' && config.LOG_LEVEL !== 'debug') return;
    console.log(JSON.stringify({ level, msg, meta: meta || null, ts: new Date().toISOString() }));
  }
}
module.exports = { log };
