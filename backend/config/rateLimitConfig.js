/**
 * 限流配置缓存
 * 从数据库读取，缓存 30 秒，管理员修改后自动生效
 */
const db = require('./database');

let cache = null;
let cacheAt = 0;
const CACHE_TTL = 30 * 1000; // 30秒

const DEFAULTS = {
  api_rate_limit_enabled: '1',
  api_rate_limit_max: '300',
  api_rate_limit_window_min: '15',
  login_rate_limit_enabled: '1',
  login_rate_limit_max: '10',
  login_rate_limit_window_min: '15',
};

async function getConfig() {
  const now = Date.now();
  if (cache && now - cacheAt < CACHE_TTL) return cache;
  try {
    const [rows] = await db.query(
      "SELECT `key`, `value` FROM system_settings WHERE `key` LIKE '%rate_limit%'"
    );
    const cfg = { ...DEFAULTS };
    rows.forEach(r => { cfg[r.key] = r.value; });
    cache = cfg;
    cacheAt = now;
    return cfg;
  } catch {
    return cache || DEFAULTS;
  }
}

// 修改配置后立即清除缓存
function clearCache() {
  cache = null;
  cacheAt = 0;
}

module.exports = { getConfig, clearCache };
