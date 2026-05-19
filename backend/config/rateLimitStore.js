/**
 * MySQL-backed store for express-rate-limit v7
 * 关键：声明 localKeys = false，告知 v7 不做本地 double-count 校验
 */
const db = require('./database');

class MysqlRateLimitStore {
  /**
   * express-rate-limit v7 要求：若 store 自己管理计数（非本地内存），
   * 必须设置 localKeys = false，否则框架会误报 ERR_ERL_DOUBLE_COUNT
   */
  localKeys = false;

  constructor({ windowMs, path }) {
    this.windowMs = windowMs;
    this.path = path;
  }

  /**
   * 每次请求进来时调用，返回 { totalHits, resetTime }
   */
  async increment(key) {
    const ip = key;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.windowMs);
    const windowStart = new Date(now.getTime() - this.windowMs);

    // 1. 插入本次命中
    try {
      await db.query(
        `INSERT INTO rate_limit_logs (ip, path, hit_at, expires_at, is_released)
         VALUES (?, ?, ?, ?, 0)`,
        [ip, this.path, now, expiresAt]
      );
    } catch (e) {
      console.error('[RateLimit] insert error:', e.message);
    }

    // 2. 统计窗口期内有效命中数
    let totalHits = 1;
    try {
      const [[row]] = await db.query(
        `SELECT COUNT(*) AS cnt FROM rate_limit_logs
         WHERE ip = ? AND path = ? AND hit_at > ? AND is_released = 0`,
        [ip, this.path, windowStart]
      );
      totalHits = parseInt(row.cnt) || 1;
    } catch (e) {
      console.error('[RateLimit] count error:', e.message);
    }

    return { totalHits, resetTime: expiresAt };
  }

  async decrement(key) {
    try {
      await db.query(
        `UPDATE rate_limit_logs SET is_released = 1
         WHERE ip = ? AND path = ? AND is_released = 0
         ORDER BY hit_at DESC LIMIT 1`,
        [key, this.path]
      );
    } catch {}
  }

  async resetKey(key) {
    try {
      await db.query(
        `UPDATE rate_limit_logs
         SET is_released = 1, released_at = NOW()
         WHERE ip = ? AND path = ? AND is_released = 0`,
        [key, this.path]
      );
    } catch {}
  }
}

module.exports = MysqlRateLimitStore;
