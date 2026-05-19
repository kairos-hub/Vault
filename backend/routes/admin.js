const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { initDefaultProducts } = require('../config/defaultProducts');
const { clearCache } = require('../config/rateLimitConfig');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.use(auth, admin);

// ── 用户列表 ─────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.username, u.email, u.is_admin, u.is_disabled, u.created_at, u.last_login_at,
        (SELECT COUNT(*) FROM products p WHERE p.user_id = u.id) AS product_count,
        (SELECT COUNT(*) FROM records r JOIN products p ON p.id = r.product_id WHERE p.user_id = u.id) AS record_count
       FROM users u ORDER BY u.created_at ASC`
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 管理员新建用户 ────────────────────────────────────────
router.post('/users', async (req, res) => {
  const { username, password, email, is_admin } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码不能少于6位' });
  }
  try {
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
        'INSERT INTO users (username, password_hash, email, is_admin) VALUES (?, ?, ?, ?)',
        [username, hash, email || null, is_admin ? 1 : 0]
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
    res.json({ success: true, message: '用户创建成功', id: newUserId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 禁用 / 启用用户 ──────────────────────────────────────
router.patch('/users/:id/toggle-disable', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ success: false, message: '不能禁用自己' });
  }
  try {
    const [rows] = await db.query('SELECT id, is_admin, is_disabled FROM users WHERE id = ?', [targetId]);
    if (!rows.length) return res.status(404).json({ success: false, message: '用户不存在' });
    if (rows[0].is_admin) return res.status(400).json({ success: false, message: '不能禁用其他管理员' });

    const newState = rows[0].is_disabled ? 0 : 1;
    await db.query('UPDATE users SET is_disabled = ? WHERE id = ?', [newState, targetId]);
    res.json({ success: true, disabled: !!newState, message: newState ? '已禁用' : '已启用' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 切换管理员权限 ────────────────────────────────────────
router.patch('/users/:id/toggle-admin', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ success: false, message: '不能修改自己的管理员权限' });
  }
  try {
    const [rows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [targetId]);
    if (!rows.length) return res.status(404).json({ success: false, message: '用户不存在' });

    const newState = rows[0].is_admin ? 0 : 1;
    await db.query('UPDATE users SET is_admin = ? WHERE id = ?', [newState, targetId]);
    res.json({ success: true, is_admin: !!newState, message: newState ? '已授予管理员权限' : '已撤销管理员权限' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 重置密码 ──────────────────────────────────────────────
router.patch('/users/:id/reset-password', async (req, res) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ success: false, message: '新密码不能少于6位' });
  }
  const targetId = parseInt(req.params.id);
  try {
    const [rows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [targetId]);
    if (!rows.length) return res.status(404).json({ success: false, message: '用户不存在' });
    // 管理员可以重置任何用户的密码，包括其他管理员
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, targetId]);
    res.json({ success: true, message: '密码已重置' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 删除用户 ──────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === req.user.id) {
    return res.status(400).json({ success: false, message: '不能删除自己' });
  }
  try {
    const [rows] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [targetId]);
    if (!rows.length) return res.status(404).json({ success: false, message: '用户不存在' });
    if (rows[0].is_admin) return res.status(400).json({ success: false, message: '不能删除其他管理员' });

    await db.query('DELETE FROM users WHERE id = ?', [targetId]);
    res.json({ success: true, message: '用户已删除' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 系统设置：注册开关 ────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT `key`, `value` FROM system_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ success: false, message: 'key 不能为空' });
  try {
    await db.query(
      'INSERT INTO system_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
      [key, value, value]
    );
    clearCache(); // 限流配置变更后立即生效
    res.json({ success: true, message: '设置已保存' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 限流日志：查看登录失败被限流的 IP ──────────────────
router.get('/rate-limits', async (req, res) => {
  try {
    // 读取限流配置
    const [cfgRows] = await db.query(
      "SELECT `key`, `value` FROM system_settings WHERE `key` LIKE '%rate_limit%'"
    );
    const cfg = {};
    cfgRows.forEach(r => { cfg[r.key] = r.value; });
    const windowMin = parseInt(cfg.login_rate_limit_window_min || '15');
    const maxFails  = parseInt(cfg.login_rate_limit_max || '10');

    // 检查 username 字段是否存在
    const [colCheck] = await db.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rate_limit_logs' AND COLUMN_NAME = 'username'"
    );
    const hasUsername = colCheck[0].cnt > 0;

    // 按 IP 聚合有效记录（未过期、未释放）
    const [ipRows] = await db.query(
      `SELECT ip, COUNT(*) AS hit_count, MAX(hit_at) AS last_hit, MAX(expires_at) AS expires_at
       FROM rate_limit_logs
       WHERE path = 'login_fail' AND is_released = 0 AND expires_at > NOW()
       GROUP BY ip
       ORDER BY last_hit DESC`
    );

    // 每个 IP 单独查尝试的账号
    const blocked = [];
    for (const row of ipRows) {
      let usernames = null;
      if (hasUsername) {
        const [uRows] = await db.query(
          `SELECT DISTINCT username FROM rate_limit_logs
           WHERE path = 'login_fail' AND ip = ? AND username IS NOT NULL AND username != ''`,
          [row.ip]
        );
        if (uRows.length > 0) usernames = uRows.map(u => u.username).join(', ');
      }
      blocked.push({ ip: row.ip, hit_count: row.hit_count, last_hit: row.last_hit, expires_at: row.expires_at, usernames });
    }

    // 详细记录列表
    const usernameCol = hasUsername ? 'username' : 'NULL AS username';
    const [logs] = await db.query(
      `SELECT id, ip, ${usernameCol}, hit_at, expires_at, is_released, released_at
       FROM rate_limit_logs
       WHERE path = 'login_fail'
       ORDER BY hit_at DESC
       LIMIT 500`
    );

    res.json({ success: true, blocked, logs, config: { windowMin, maxFails } });
  } catch (err) {
    console.error('[rate-limits]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 解除某 IP 的限制 ─────────────────────────────────────
router.post('/rate-limits/release', async (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ success: false, message: 'IP 不能为空' });
  try {
    await db.query(
      `UPDATE rate_limit_logs SET is_released = 1, released_at = NOW()
       WHERE ip = ? AND path = 'login_fail' AND is_released = 0`,
      [ip]
    );
    res.json({ success: true, message: `已解除 ${ip} 的访问限制` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── 删除限流记录 ──────────────────────────────────────────
router.delete('/rate-limits', async (req, res) => {
  const { ip, id } = req.body;
  try {
    if (id) {
      await db.query("DELETE FROM rate_limit_logs WHERE id = ? AND path = 'login_fail'", [id]);
    } else if (ip) {
      await db.query("DELETE FROM rate_limit_logs WHERE ip = ? AND path = 'login_fail'", [ip]);
    } else {
      await db.query("DELETE FROM rate_limit_logs WHERE path = 'login_fail' AND (expires_at < NOW() OR is_released = 1)");
    }
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

