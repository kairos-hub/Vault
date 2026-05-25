const jwt = require('jsonwebtoken');
require('dotenv').config();

const db = require('../config/database');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权，请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 实时校验用户是否被禁用（防止禁用后旧 Token 仍可用）
    const [rows] = await db.query('SELECT is_disabled FROM users WHERE id = ?', [decoded.id]);
    if (!rows.length || rows[0].is_disabled) {
      return res.status(401).json({ success: false, message: '账号已被禁用，请重新登录' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token 无效或已过期，请重新登录' });
  }
};
