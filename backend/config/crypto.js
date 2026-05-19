const CryptoJS = require('crypto-js');
require('dotenv').config();

const ENCRYPT_KEY = process.env.ENCRYPT_KEY || 'default_key_change_in_production!!';

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
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (e) {
    return cipherText; // 解密失败返回原文
  }
}

module.exports = { encrypt, decrypt };
