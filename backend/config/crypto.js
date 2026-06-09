const CryptoJS = require('crypto-js');
require('dotenv').config();

const ENCRYPT_KEY = process.env.ENCRYPT_KEY;
if (!ENCRYPT_KEY || ENCRYPT_KEY.length < 16) {
  console.error('❌ 启动失败：ENCRYPT_KEY 未配置或长度不足16位，请在 .env 中设置');
  process.exit(1);
}

/**
 * 加密敏感字段（密码等）
 */
function encrypt(text) {
  if (!text) return text;
  return CryptoJS.AES.encrypt(text, ENCRYPT_KEY).toString();
}

/**
 * 解密敏感字段
 */
function decrypt(cipherText) {
  if (!cipherText) return cipherText;
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPT_KEY);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    // result 为空说明 key 不匹配或数据损坏（CryptoJS 不抛异常，静默返回空）
    if (!result) return null;
    return result;
  } catch (e) {
    return null;
  }
}

module.exports = { encrypt, decrypt };
