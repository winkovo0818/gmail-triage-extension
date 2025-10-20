// src/utils/encryption.js
// 简单的加密辅助函数，使用Node.js的crypto模块。生产环境请使用KMS。
const crypto = require('crypto');
const ALGO = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY || 'change-me').digest();

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(b64) {
  const data = Buffer.from(b64, 'base64');
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const encrypted = data.slice(28);
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return out.toString('utf8');
}

module.exports = { encrypt, decrypt };
