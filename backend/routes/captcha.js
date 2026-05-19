const router = require('express').Router();

// 随机字符集（去掉易混淆的 0/O/1/I/l）
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChar() {
  return CHARS[randInt(0, CHARS.length - 1)];
}

function randColor(alpha = 1) {
  return `rgba(${randInt(30,180)},${randInt(30,180)},${randInt(30,180)},${alpha})`;
}

/**
 * 生成干扰线 SVG path
 */
function makeLine() {
  const x1 = randInt(0, 120), y1 = randInt(0, 40);
  const x2 = randInt(0, 120), y2 = randInt(0, 40);
  const cx = randInt(0, 120), cy = randInt(0, 40);
  return `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}"
    stroke="${randColor(0.35)}" stroke-width="${randInt(1,2)}" fill="none"/>`;
}

/**
 * 生成干扰点
 */
function makeDots() {
  let dots = '';
  for (let i = 0; i < 40; i++) {
    dots += `<circle cx="${randInt(0,120)}" cy="${randInt(0,40)}"
      r="${randInt(1,2)}" fill="${randColor(0.25)}"/>`;
  }
  return dots;
}

/**
 * 生成单个字符 SVG text，随机旋转/颜色
 */
function makeChar(ch, x) {
  const rotate = randInt(-18, 18);
  const y = randInt(26, 32);
  const color = randColor(0.9);
  const size = randInt(20, 26);
  return `<text x="${x}" y="${y}"
    transform="rotate(${rotate},${x},${y})"
    font-size="${size}" font-weight="bold"
    font-family="'Arial','Helvetica',sans-serif"
    fill="${color}"
    letter-spacing="2">${ch}</text>`;
}

/**
 * 生成 SVG 验证码图片
 */
function generateSvgCaptcha(text) {
  const width = 120, height = 40;
  const chars = text.split('').map((ch, i) => makeChar(ch, 10 + i * 26)).join('');
  const lines = Array.from({ length: 5 }, makeLine).join('');
  const dots = makeDots();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" rx="6" fill="transparent"/>
  ${dots}
  ${lines}
  ${chars}
</svg>`;
}

// GET /api/captcha  — 返回 SVG 图片，同时把答案存入 session
router.get('/', (req, res) => {
  let text = '';
  for (let i = 0; i < 4; i++) text += randChar();

  req.session.captcha = {
    text: text.toLowerCase(),
    createdAt: Date.now(),
  };

  const svg = generateSvgCaptcha(text);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-store, no-cache');
  res.send(svg);
});

module.exports = router;
