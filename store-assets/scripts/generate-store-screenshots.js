const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'store-assets', 'sources');
const OUT_DIR = path.join(ROOT, 'store-assets', 'screenshots');
const ICON_DATA = fs.readFileSync(path.join(ROOT, 'icons', 'icon128.png')).toString('base64');

fs.mkdirSync(SOURCE_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 1280;
const H = 800;

function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function text({ x, y, value, size = 32, weight = 500, fill = '#102033', anchor = 'start', opacity = 1, family = 'system-ui, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, Helvetica Neue, Arial, sans-serif' }) {
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${esc(value)}</text>`;
}

function multiline(lines, x, y, opts = {}) {
  const gap = opts.gap || Math.round((opts.size || 30) * 1.45);
  return lines.map((line, i) => text({ ...opts, x, y: y + i * gap, value: line })).join('\n');
}

function chip(x, y, label, color = '#0d7cc1') {
  const width = Math.max(150, label.length * 15 + 42);
  return `
    <rect x="${x}" y="${y}" width="${width}" height="44" rx="22" fill="${color}" opacity="0.1"/>
    <circle cx="${x + 24}" cy="${y + 22}" r="6" fill="${color}"/>
    ${text({ x: x + 42, y: y + 29, value: label, size: 18, weight: 650, fill: color })}
  `;
}

function arrowButton(cx, cy, dir, fill) {
  const points = dir === 'up'
    ? `${cx},${cy - 18} ${cx - 19},${cy + 8} ${cx - 8},${cy + 8} ${cx - 8},${cy + 22} ${cx + 8},${cy + 22} ${cx + 8},${cy + 8} ${cx + 19},${cy + 8}`
    : `${cx},${cy + 18} ${cx - 19},${cy - 8} ${cx - 8},${cy - 8} ${cx - 8},${cy - 22} ${cx + 8},${cy - 22} ${cx + 8},${cy - 8} ${cx + 19},${cy - 8}`;
  return `
    <circle cx="${cx}" cy="${cy}" r="36" fill="${fill}"/>
    <polygon points="${points}" fill="#fff"/>
  `;
}

function browserMockup(x, y, width, height, locale) {
  const chinese = locale === 'zh';
  const lineBase = Array.from({ length: 12 }, (_, i) => {
    const yy = y + 116 + i * 30;
    const ww = [360, 430, 500, 390, 470, 310, 540, 420, 480, 340, 520, 280][i];
    return `<rect x="${x + 52}" y="${yy}" width="${ww}" height="12" rx="6" fill="#d9e7f2"/>`;
  }).join('\n');
  return `
    <g filter="url(#softShadow)">
      <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="20" fill="#ffffff"/>
      <rect x="${x}" y="${y}" width="${width}" height="70" rx="20" fill="#eef5fb"/>
      <rect x="${x}" y="${y + 48}" width="${width}" height="22" fill="#eef5fb"/>
      <circle cx="${x + 32}" cy="${y + 34}" r="8" fill="#ff6b6b"/>
      <circle cx="${x + 58}" cy="${y + 34}" r="8" fill="#ffc857"/>
      <circle cx="${x + 84}" cy="${y + 34}" r="8" fill="#4cc38a"/>
      <rect x="${x + 128}" y="${y + 19}" width="${width - 176}" height="30" rx="15" fill="#ffffff"/>
      ${text({ x: x + 152, y: y + 40, value: chinese ? 'example.com/长页面文章' : 'example.com/long-article', size: 16, fill: '#5d7187' })}
      <rect x="${x + 52}" y="${y + 100}" width="230" height="20" rx="10" fill="#2a3c52"/>
      ${lineBase}
      <rect x="${x + width - 110}" y="${y + 128}" width="72" height="156" rx="36" fill="#f4fbff" stroke="#c9dfea" stroke-width="2"/>
      ${arrowButton(x + width - 74, y + 172, 'up', '#4a9edd')}
      ${arrowButton(x + width - 74, y + 240, 'down', '#25a967')}
      <rect x="${x + width - 92}" y="${y + height - 106}" width="38" height="76" rx="19" fill="#d8e5ef"/>
      <rect x="${x + width - 82}" y="${y + height - 94}" width="18" height="30" rx="9" fill="#4a9edd"/>
    </g>
  `;
}

function popupMockup(x, y, locale) {
  const chinese = locale === 'zh';
  return `
    <g filter="url(#softShadow)">
      <rect x="${x}" y="${y}" width="300" height="170" rx="18" fill="#ffffff"/>
      <rect x="${x + 24}" y="${y + 28}" width="252" height="62" rx="12" fill="#f5fbff"/>
      ${text({ x: x + 44, y: y + 66, value: chinese ? '在该网站启用' : 'Enable on this site', size: 20, weight: 700, fill: '#263b50' })}
      <rect x="${x + 212}" y="${y + 46}" width="44" height="24" rx="12" fill="#4caf50"/>
      <circle cx="${x + 244}" cy="${y + 58}" r="9" fill="#ffffff"/>
      <rect x="${x + 24}" y="${y + 110}" width="252" height="36" rx="8" fill="#e9eef3"/>
      ${text({ x: x + 150, y: y + 135, value: chinese ? '设置' : 'Settings', size: 18, weight: 700, fill: '#3c4b59', anchor: 'middle' })}
    </g>
  `;
}

function settingsMockup(x, y, locale) {
  const chinese = locale === 'zh';
  const labels = chinese
    ? ['滚动速度', '按钮尺寸', '透明度', '按钮位置']
    : ['Scroll speed', 'Button size', 'Opacity', 'Button position'];
  return `
    <g filter="url(#softShadow)">
      <rect x="${x}" y="${y}" width="620" height="480" rx="20" fill="#ffffff"/>
      <rect x="${x}" y="${y}" width="620" height="72" rx="20" fill="#eef5fb"/>
      <rect x="${x}" y="${y + 50}" width="620" height="22" fill="#eef5fb"/>
      <image x="${x + 30}" y="${y + 20}" width="32" height="32" href="data:image/png;base64,${ICON_DATA}"/>
      ${text({ x: x + 78, y: y + 44, value: chinese ? '一键顶部/底部滚动 设置' : 'One Click Top & Bottom Settings', size: 24, weight: 760, fill: '#23384c' })}
      ${labels.map((label, i) => {
        const yy = y + 116 + i * 76;
        return `
          ${text({ x: x + 44, y: yy, value: label, size: 20, weight: 700, fill: '#2a3c52' })}
          <rect x="${x + 44}" y="${yy + 22}" width="390" height="10" rx="5" fill="#dce9f2"/>
          <rect x="${x + 44}" y="${yy + 22}" width="${[250, 310, 230, 340][i]}" height="10" rx="5" fill="${['#4a9edd', '#25a967', '#f1a43a', '#7b61ff'][i]}"/>
          <circle cx="${x + 44 + [250, 310, 230, 340][i]}" cy="${yy + 27}" r="14" fill="#ffffff" stroke="${['#4a9edd', '#25a967', '#f1a43a', '#7b61ff'][i]}" stroke-width="4"/>
        `;
      }).join('')}
      <rect x="${x + 458}" y="${y + 112}" width="120" height="248" rx="16" fill="#f6fafc" stroke="#d7e6ef"/>
      ${arrowButton(x + 518, y + 180, 'up', '#4a9edd')}
      ${arrowButton(x + 518, y + 262, 'down', '#25a967')}
      <rect x="${x + 44}" y="${y + 398}" width="154" height="46" rx="23" fill="#4a9edd"/>
      ${text({ x: x + 121, y: y + 428, value: chinese ? '保存设置' : 'Save settings', size: 18, weight: 750, fill: '#ffffff', anchor: 'middle' })}
    </g>
  `;
}

function baseDefs() {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f7fbff"/>
        <stop offset="0.48" stop-color="#ecf7f3"/>
        <stop offset="1" stop-color="#fff9ec"/>
      </linearGradient>
      <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#4a9edd"/>
        <stop offset="1" stop-color="#25a967"/>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="18" flood-color="#24415d" flood-opacity="0.16"/>
      </filter>
    </defs>
  `;
}

function frame(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  ${baseDefs()}
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="1120" cy="110" r="210" fill="#4a9edd" opacity="0.08"/>
  <circle cx="80" cy="720" r="230" fill="#25a967" opacity="0.08"/>
  ${inner}
</svg>`;
}

const assets = [
  {
    name: 'zh-CN-01-overview',
    svg: frame(`
      <image x="76" y="74" width="86" height="86" href="data:image/png;base64,${ICON_DATA}"/>
      ${text({ x: 184, y: 118, value: '一键顶部/底部滚动', size: 52, weight: 850, fill: '#18324a' })}
      ${text({ x: 186, y: 164, value: '长页面浏览，一键到达顶部或底部', size: 26, weight: 650, fill: '#2d617b' })}
      ${multiline(['浮动按钮常驻页面边缘', '平滑滚动动画与快捷键', '可按网站启用或停用'], 90, 250, { size: 30, weight: 750, fill: '#21384e', gap: 58 })}
      ${chip(90, 448, '顶部 / 底部滚动')}
      ${chip(288, 448, '站点开关', '#25a967')}
      ${chip(446, 448, '中英文界面', '#7b61ff')}
      ${browserMockup(650, 105, 540, 580, 'zh')}
      ${popupMockup(845, 520, 'zh')}
    `),
  },
  {
    name: 'zh-CN-02-settings',
    svg: frame(`
      ${text({ x: 80, y: 118, value: '按你的浏览习惯定制滚动体验', size: 46, weight: 850, fill: '#18324a' })}
      ${text({ x: 82, y: 164, value: '速度、位置、尺寸、颜色和透明度都可以细调', size: 28, weight: 650, fill: '#2d617b' })}
      ${settingsMockup(80, 230, 'zh')}
      <g transform="translate(780 236)">
        ${chip(0, 0, '10ms - 2000ms 速度')}
        ${chip(0, 72, '10px - 120px 尺寸', '#25a967')}
        ${chip(0, 144, '0% - 100% 透明度', '#f1a43a')}
        ${chip(0, 216, '全屏自动隐藏', '#7b61ff')}
        ${chip(0, 288, '悬停 + 快捷键隐藏', '#d64f7f')}
      </g>
      ${text({ x: 780, y: 638, value: '设置会自动保存，并同步到已打开的页面。', size: 22, weight: 700, fill: '#263b50' })}
    `),
  },
  {
    name: 'en-01-overview',
    svg: frame(`
      <image x="76" y="74" width="86" height="86" href="data:image/png;base64,${ICON_DATA}"/>
      ${text({ x: 184, y: 118, value: 'One Click Top & Bottom', size: 52, weight: 850, fill: '#18324a' })}
      ${text({ x: 186, y: 164, value: 'Jump through long pages in one click', size: 26, weight: 650, fill: '#2d617b' })}
      ${multiline(['Floating page-edge controls', 'Smooth scrolling and shortcuts', 'Enable or disable per website'], 90, 250, { size: 30, weight: 750, fill: '#21384e', gap: 58 })}
      ${chip(90, 448, 'Top / bottom scroll')}
      ${chip(310, 448, 'Site toggle', '#25a967')}
      ${chip(470, 448, 'Bilingual UI', '#7b61ff')}
      ${browserMockup(650, 105, 540, 580, 'en')}
      ${popupMockup(845, 520, 'en')}
    `),
  },
  {
    name: 'en-02-settings',
    svg: frame(`
      ${text({ x: 80, y: 118, value: 'Customize scrolling for the way you browse', size: 44, weight: 850, fill: '#18324a' })}
      ${text({ x: 82, y: 164, value: 'Fine-tune speed, position, size, color, and opacity', size: 28, weight: 650, fill: '#2d617b' })}
      ${settingsMockup(80, 230, 'en')}
      <g transform="translate(780 236)">
        ${chip(0, 0, '10ms - 2000ms speed')}
        ${chip(0, 72, '10px - 120px size', '#25a967')}
        ${chip(0, 144, '0% - 100% opacity', '#f1a43a')}
        ${chip(0, 216, 'Auto-hide in fullscreen', '#7b61ff')}
        ${chip(0, 288, 'Hover + shortcut hide', '#d64f7f')}
      </g>
      ${text({ x: 780, y: 638, value: 'Settings save automatically.', size: 22, weight: 700, fill: '#263b50' })}
    `),
  },
];

for (const asset of assets) {
  const file = path.join(SOURCE_DIR, `${asset.name}.svg`);
  fs.writeFileSync(file, asset.svg, 'utf8');
  console.log(file);
}
