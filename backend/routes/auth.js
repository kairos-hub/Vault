const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { initDefaultProducts } = require('../config/defaultProducts');
const { getConfig } = require('../config/rateLimitConfig');
require('dotenv').config();

/**
 * 检查该 IP 在窗口期内的失败次数，超限则返回剩余秒数，否则返回 0
 */
async function checkLoginRateLimit(ip) {
  const cfg = await getConfig();
  const LOGIN_WINDOW_MS = parseInt(cfg.login_rate_limit_window_min) * 60 * 1000;
  const LOGIN_MAX_FAILS = parseInt(cfg.login_rate_limit_max);
  // 开关关闭时直接放行
  if (cfg.login_rate_limit_enabled !== '1') return { blocked: false, count: 0, LOGIN_MAX_FAILS };
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MS);
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS cnt FROM rate_limit_logs
     WHERE ip = ? AND path = 'login_fail'
       AND hit_at > ? AND is_released = 0`,
    [ip, windowStart]
  );
  const count = parseInt(row.cnt) || 0;
  if (count >= LOGIN_MAX_FAILS) {
    const [[earliest]] = await db.query(
      `SELECT expires_at FROM rate_limit_logs
       WHERE ip = ? AND path = 'login_fail'
         AND hit_at > ? AND is_released = 0
       ORDER BY hit_at ASC LIMIT 1`,
      [ip, windowStart]
    );
    const remainMs = earliest ? Math.max(0, new Date(earliest.expires_at) - Date.now()) : 0;
    const remainMin = Math.ceil(remainMs / 60000);
    return { blocked: true, remainMin, count, LOGIN_MAX_FAILS };
  }
  return { blocked: false, count, LOGIN_MAX_FAILS };
}

/**
 * 记录一次登录失败
 */
async function recordLoginFail(ip, username) {
  const cfg = await getConfig();
  const LOGIN_WINDOW_MS = parseInt(cfg.login_rate_limit_window_min) * 60 * 1000;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOGIN_WINDOW_MS);
  await db.query(
    `INSERT INTO rate_limit_logs (ip, username, path, hit_at, expires_at, is_released)
     VALUES (?, ?, 'login_fail', ?, ?, 0)`,
    [ip, username || null, now, expiresAt]
  );
}

async function isRegisterAllowed() {
  const [rows] = await db.query(
    "SELECT `value` FROM system_settings WHERE `key` = 'allow_register'"
  );
  return rows.length === 0 || rows[0].value === '1';
}

// GET /api/auth/register-status
router.get('/register-status', async (req, res) => {
  const allowed = await isRegisterAllowed();
  res.json({ success: true, allow_register: allowed });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  try {
    const allowed = await isRegisterAllowed();
    if (!allowed) {
      return res.status(403).json({ success: false, message: '注册功能已关闭，请联系管理员' });
    }
    const [exists] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: '用户名已存在' });
    }
    const hash = await bcrypt.hash(password, 10);
    const conn = await db.getConnection();
    await conn.beginTransaction();
    let newUserId;
    try {
      const [result] = await conn.query(
        'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
        [username, hash, email || null]
      );
      newUserId = result.insertId;
      await initDefaultProducts(conn, newUserId);
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      conn.release();
      throw e;
    }
    conn.release();
    const token = jwt.sign(
      { id: newUserId, username, is_admin: 0 },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({
      success: true,
      message: '注册成功',
      token,
      user: { id: newUserId, username, is_admin: 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ip = req.realIp || req.socket?.remoteAddress?.replace(/^::ffff:/, '') || '0.0.0.0';

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  try {
    // 1. 先检查该 IP 是否已被限流
    const limitStatus = await checkLoginRateLimit(ip);
    if (limitStatus.blocked) {
      return res.status(429).json({
        success: false,
        message: `登录失败次数过多，请 ${limitStatus.remainMin} 分钟后再试`,
        code: 'RATE_LIMITED'
      });
    }

    // 2. 查用户
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      // 用户不存在也计为失败（防止枚举用户名）
      await recordLoginFail(ip, username);
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = rows[0];

    // 3. 检查禁用
    if (user.is_disabled) {
      return res.status(403).json({ success: false, message: '账号已被禁用，请联系管理员' });
    }

    // 4. 验证密码
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await recordLoginFail(ip, username);
      const remaining = (limitStatus.LOGIN_MAX_FAILS || 10) - (limitStatus.count + 1);
      return res.status(401).json({
        success: false,
        message: remaining > 0
          ? `用户名或密码错误，还剩 ${remaining} 次机会`
          : '用户名或密码错误，账号已被临时锁定'
      });
    }

    // 5. 登录成功 —— 记录登录时间，不计数，不清除失败记录（自然过期）
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({
      success: true,
      message: '登录成功',
      token,
      user: { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '服务器错误', error: err.message });
  }
});

module.exports = router;
