/**
 * 纯 Node.js SVG 验证码生成器，无需第三方库
 * 生成带干扰线、噪点、随机字符倾斜的 SVG
 */
const crypto = require('crypto');

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混淆字符 0/O/1/I
const WIDTH = 120;
const HEIGHT = 40;
const FONT_SIZE = 22;
const CAPTCHA_TTL = 5 * 60 * 1000; // 5分钟

// 内存存储验证码（key -> { text, expiresAt }）
const store = new Map();

// 定期清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt < now) store.delete(k);
  }
}, 60 * 1000);

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randColor(minBrightness = 0, maxBrightness = 180) {
  const r = rand(minBrightness, maxBrightness);
  const g = rand(minBrightness, maxBrightness);
  const b = rand(minBrightness, maxBrightness);
  return `rgb(${r},${g},${b})`;
}

function generateSVG(text) {
  const lines = [];

  // 背景
  lines.push(`<rect width="${WIDTH}" height="${HEIGHT}" fill="#f0f4ff" rx="4"/>`);

  // 干扰线（4条）
  for (let i = 0; i < 4; i++) {
    lines.push(`<line x1="${rand(0, WIDTH / 2)}" y1="${rand(0, HEIGHT)}" x2="${rand(WIDTH / 2, WIDTH)}" y2="${rand(0, HEIGHT)}" stroke="${randColor(100, 200)}" stroke-width="${rand(1, 2)}" opacity="0.5"/>`);
  }

  // 噪点（20个）
  for (let i = 0; i < 20; i++) {
    lines.push(`<circle cx="${rand(0, WIDTH)}" cy="${rand(0, HEIGHT)}" r="1" fill="${randColor(100, 200)}" opacity="0.4"/>`);
  }

  // 字符（逐个渲染，每个随机倾斜、颜色、位移）
  const charWidth = WIDTH / (text.length + 1);
  for (let i = 0; i < text.length; i++) {
    const x = charWidth * (i + 0.7) + rand(-3, 3);
    const y = HEIGHT / 2 + FONT_SIZE / 3 + rand(-3, 3);
    const rotate = rand(-20, 20);
    const color = randColor(20, 120);
    lines.push(
      `<text x="${x}" y="${y}" font-size="${rand(FONT_SIZE - 2, FONT_SIZE + 2)}" font-family="Arial,sans-serif" font-weight="bold" fill="${color}" transform="rotate(${rotate},${x},${y})" letter-spacing="1">${text[i]}</text>`
    );
  }

  // 波浪干扰线（覆盖在字符上）
  const y1 = rand(10, 30), y2 = rand(10, 30), y3 = rand(10, 30);
  lines.push(`<path d="M0,${y1} Q${WIDTH / 3},${y2} ${WIDTH / 2},${HEIGHT / 2} T${WIDTH},${y3}" stroke="${randColor(150, 210)}" stroke-width="1.5" fill="none" opacity="0.5"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">${lines.join('')}</svg>`;
}

/**
 * 生成验证码，返回 { id, svg }
 * id 用于后续校验，svg 直接返回给前端显示
 */
function createCaptcha() {
  let text = '';
  for (let i = 0; i < 4; i++) {
    text += CHARS[rand(0, CHARS.length - 1)];
  }
  const id = crypto.randomBytes(16).toString('hex');
  store.set(id, { text: text.toUpperCase(), expiresAt: Date.now() + CAPTCHA_TTL });
  const svg = generateSVG(text);
  return { id, svg };
}

/**
 * 校验验证码，验证后立即删除（一次性）
 * @returns { valid: boolean, message?: string }
 */
function verifyCaptcha(id, input) {
  if (!id || !input) return { valid: false, message: '验证码不能为空' };
  const entry = store.get(id);
  if (!entry) return { valid: false, message: '验证码已过期，请刷新' };
  if (entry.expiresAt < Date.now()) {
    store.delete(id);
    return { valid: false, message: '验证码已过期，请刷新' };
  }
  // 删除（一次性）
  store.delete(id);
  if (entry.text !== input.trim().toUpperCase()) {
    return { valid: false, message: '验证码错误' };
  }
  return { valid: true };
}

module.exports = { createCaptcha, verifyCaptcha };
