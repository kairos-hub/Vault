const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 获取真实 IP
function getRealIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = forwarded
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || '0.0.0.0';
  return ip.replace(/^::ffff:/, '');
}

app.use((req, res, next) => {
  req.realIp = getRealIp(req);
  next();
});

function isAdminToken(req) {
  try {
    const jwt = require('jsonwebtoken');
    const auth = req.headers.authorization?.split(' ')[1];
    if (auth) {
      const decoded = jwt.verify(auth, process.env.JWT_SECRET);
      return !!decoded.is_admin;
    }
  } catch {}
  return false;
}

// ── 动态 API 限流中间件 ───────────────────────────────────
const { getConfig } = require('./config/rateLimitConfig');
const MysqlRateLimitStore = require('./config/rateLimitStore');

// 独立 store 实例，窗口期变化时重建
let apiStoreInstance = null;
let apiStoreWindowMs = null;

app.use('/api/', async (req, res, next) => {
  // auth 路径跳过（登录限流在路由内手动处理）
  if (req.path.startsWith('/auth')) return next();
  // 管理员跳过
  if (isAdminToken(req)) return next();

  try {
    const cfg = await getConfig();
    // 开关关闭则跳过
    if (cfg.api_rate_limit_enabled !== '1') return next();

    const windowMs = parseInt(cfg.api_rate_limit_window_min) * 60 * 1000;
    const max = parseInt(cfg.api_rate_limit_max);

    // 窗口期变化时重建 store
    if (!apiStoreInstance || apiStoreWindowMs !== windowMs) {
      apiStoreInstance = new MysqlRateLimitStore({ windowMs, path: '/api' });
      apiStoreWindowMs = windowMs;
    }

    const { totalHits, resetTime } = await apiStoreInstance.increment(req.realIp);

    // 设置标准限流响应头
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - totalHits));
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime.getTime() / 1000));

    if (totalHits > max) {
      const remainMin = Math.ceil((resetTime.getTime() - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `请求过于频繁，请 ${remainMin} 分钟后再试`,
        code: 'RATE_LIMITED'
      });
    }
  } catch (e) {
    console.error('[apiLimiter]', e.message);
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/records', require('./routes/records'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Vault API 运行正常', time: new Date(), your_ip: req.realIp });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Vault 后端服务运行在 http://0.0.0.0:${PORT}`);
});
