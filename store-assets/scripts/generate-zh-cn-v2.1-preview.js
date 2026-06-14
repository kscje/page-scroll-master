const fs = require('fs');
const path = require('path');
const sharp = require('/Users/gemingming/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');
const storeScreenshotLocales = require('./store-screenshot-locales');

const ROOT = path.resolve(__dirname, '..', '..');
const OUTPUT_DIR = path.join(ROOT, 'store-assets', 'previews', 'zh-CN-v2.1');
const SOURCE_DIR = path.join(OUTPUT_DIR, 'sources');
const ICON_DATA = fs.readFileSync(path.join(ROOT, 'icons', 'icon128.png')).toString('base64');
const WIDTH = 1280;
const HEIGHT = 800;

fs.mkdirSync(SOURCE_DIR, { recursive: true });

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function text(x, y, value, options = {}) {
  const {
    size = 28,
    weight = 600,
    fill = '#f7fbff',
    anchor = 'start',
    opacity = 1
  } = options;

  return `<text x="${x}" y="${y}" font-family="system-ui, -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei, Helvetica Neue, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${escapeXml(value)}</text>`;
}

function roundedCard(x, y, width, height, options = {}) {
  const {
    radius = 28,
    fill = '#ffffff',
    opacity = 1,
    stroke = 'none',
    strokeWidth = 0,
    filter = 'url(#shadow)'
  } = options;

  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" opacity="${opacity}" stroke="${stroke}" stroke-width="${strokeWidth}" filter="${filter}"/>`;
}

function pill(x, y, width, label, options = {}) {
  const {
    fill = '#1fca91',
    textFill = '#08293b',
    dot = '',
    size = 18
  } = options;
  const dotMarkup = dot
    ? `<circle cx="${x + 24}" cy="${y + 22}" r="6" fill="${dot}"/>`
    : '';
  const textX = dot ? x + 42 : x + width / 2;
  const anchor = dot ? 'start' : 'middle';

  return `
    <rect x="${x}" y="${y}" width="${width}" height="44" rx="22" fill="${fill}"/>
    ${dotMarkup}
    ${text(textX, y + 29, label, { size, weight: 750, fill: textFill, anchor })}
  `;
}

function toggle(x, y, enabled = true, disabled = false) {
  const track = disabled ? '#d1dbe3' : enabled ? '#1fca91' : '#8395a7';
  const knobX = enabled ? x + 42 : x + 18;
  return `
    <rect x="${x}" y="${y}" width="60" height="34" rx="17" fill="${track}" opacity="${disabled ? 0.7 : 1}"/>
    <circle cx="${knobX}" cy="${y + 17}" r="13" fill="#ffffff"/>
  `;
}

function arrowIcon(cx, cy, direction, color = '#ffffff') {
  const pathData = direction === 'up'
    ? `M ${cx} ${cy - 20} L ${cx - 20} ${cy + 5} H ${cx - 8} V ${cy + 22} H ${cx + 8} V ${cy + 5} H ${cx + 20} Z`
    : `M ${cx} ${cy + 20} L ${cx - 20} ${cy - 5} H ${cx - 8} V ${cy - 22} H ${cx + 8} V ${cy - 5} H ${cx + 20} Z`;
  return `<path d="${pathData}" fill="${color}"/>`;
}

function bookmarkIcon(cx, cy, color = '#ffffff') {
  return `<path d="M ${cx - 15} ${cy - 21} H ${cx + 15} V ${cy + 23} L ${cx} ${cy + 13} L ${cx - 15} ${cy + 23} Z" fill="${color}"/>`;
}

function outlineIcon(cx, cy, color = '#ffffff') {
  return `
    <circle cx="${cx - 16}" cy="${cy - 15}" r="3.5" fill="${color}"/>
    <circle cx="${cx - 16}" cy="${cy}" r="3.5" fill="${color}"/>
    <circle cx="${cx - 16}" cy="${cy + 15}" r="3.5" fill="${color}"/>
    <path d="M ${cx - 7} ${cy - 15} H ${cx + 18} M ${cx - 7} ${cy} H ${cx + 18} M ${cx - 7} ${cy + 15} H ${cx + 18}" stroke="${color}" stroke-width="6" stroke-linecap="round"/>
  `;
}

function controlButton(cx, cy, fill, icon) {
  let glyph = '';
  if (icon === 'up' || icon === 'down') {
    glyph = arrowIcon(cx, cy, icon);
  } else if (icon === 'bookmark') {
    glyph = bookmarkIcon(cx, cy);
  } else {
    glyph = outlineIcon(cx, cy);
  }

  return `<circle cx="${cx}" cy="${cy}" r="34" fill="${fill}" filter="url(#smallShadow)"/>${glyph}`;
}

function browserChrome(x, y, width) {
  return `
    <rect x="${x}" y="${y}" width="${width}" height="68" rx="24" fill="#eaf2f8"/>
    <rect x="${x}" y="${y + 44}" width="${width}" height="24" fill="#eaf2f8"/>
    <circle cx="${x + 34}" cy="${y + 32}" r="8" fill="#ff6b6b"/>
    <circle cx="${x + 60}" cy="${y + 32}" r="8" fill="#ffc857"/>
    <circle cx="${x + 86}" cy="${y + 32}" r="8" fill="#48c78e"/>
    <rect x="${x + 126}" y="${y + 17}" width="${width - 170}" height="30" rx="15" fill="#ffffff"/>
  `;
}

function base(title, subtitle, body, options = {}) {
  const { eyebrow = 'SMART SCROLL NAVIGATOR · V2.1' } = options;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#071a2a"/>
      <stop offset="0.58" stop-color="#0c2f43"/>
      <stop offset="1" stop-color="#075b59"/>
    </linearGradient>
    <linearGradient id="aqua" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#50d7ff"/>
      <stop offset="1" stop-color="#1fca91"/>
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd166"/>
      <stop offset="1" stop-color="#ff8e6e"/>
    </linearGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#020b12" flood-opacity="0.32"/>
    </filter>
    <filter id="smallShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#071a2a" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#background)"/>
  <circle cx="1135" cy="100" r="260" fill="#50d7ff" opacity="0.08"/>
  <circle cx="105" cy="745" r="260" fill="#1fca91" opacity="0.09"/>
  <path d="M 0 670 C 280 590, 490 790, 790 690 S 1110 580, 1280 650 V 800 H 0 Z" fill="#ffffff" opacity="0.035"/>
  ${text(72, 70, eyebrow, { size: 17, weight: 800, fill: '#74e7ca' })}
  ${text(72, 130, title, { size: 50, weight: 850 })}
  ${text(74, 177, subtitle, { size: 25, weight: 600, fill: '#b8d5df' })}
  ${body}
</svg>`;
}

function overviewSvg() {
  const browserX = 586;
  const browserY = 218;
  return base(
    '长页面，一路顺畅',
    '顶部/底部跳转、页面进度、书签与智能段落导航',
    `
      ${pill(74, 224, 184, '一键到顶 / 到底', { fill: '#dff8ff', textFill: '#0b4863' })}
      ${pill(74, 282, 184, '进度点击跳转', { fill: '#ddf8ed', textFill: '#086149' })}
      ${pill(74, 340, 184, '阅读位置书签', { fill: '#fff1cf', textFill: '#7b4d00' })}
      ${pill(74, 398, 184, '智能段落跳转', { fill: '#f0e9ff', textFill: '#51328a' })}
      ${text(74, 492, '适合文章、文档、Wiki、Notion', { size: 27, weight: 760 })}
      ${text(74, 530, '以及需要频繁滚动的长页面。', { size: 27, weight: 760 })}
      <g opacity="0.86">
        <circle cx="88" cy="595" r="8" fill="#50d7ff"/>
        ${text(108, 603, '智能识别页面与自定义滚动容器', { size: 20, weight: 650, fill: '#c7e1e8' })}
        <circle cx="88" cy="640" r="8" fill="#1fca91"/>
        ${text(108, 648, '支持 SPA 页面动态内容与章节更新', { size: 20, weight: 650, fill: '#c7e1e8' })}
      </g>
      ${roundedCard(browserX, browserY, 626, 500, { radius: 28 })}
      ${browserChrome(browserX, browserY, 626)}
      ${text(browserX + 150, browserY + 39, 'docs.example.com/guide', { size: 16, weight: 550, fill: '#6d7e8b' })}
      <rect x="${browserX + 44}" y="${browserY + 103}" width="252" height="22" rx="11" fill="#18354b"/>
      <rect x="${browserX + 44}" y="${browserY + 151}" width="438" height="13" rx="7" fill="#dce9f1"/>
      <rect x="${browserX + 44}" y="${browserY + 183}" width="500" height="13" rx="7" fill="#dce9f1"/>
      <rect x="${browserX + 44}" y="${browserY + 215}" width="408" height="13" rx="7" fill="#dce9f1"/>
      <rect x="${browserX + 44}" y="${browserY + 247}" width="470" height="13" rx="7" fill="#dce9f1"/>
      <rect x="${browserX + 44}" y="${browserY + 294}" width="190" height="18" rx="9" fill="#486477"/>
      <rect x="${browserX + 44}" y="${browserY + 336}" width="468" height="13" rx="7" fill="#dce9f1"/>
      <rect x="${browserX + 44}" y="${browserY + 368}" width="420" height="13" rx="7" fill="#dce9f1"/>
      <rect x="${browserX + 44}" y="${browserY + 400}" width="486" height="13" rx="7" fill="#dce9f1"/>
      <rect x="${browserX + 44}" y="${browserY + 455}" width="526" height="9" rx="5" fill="#d7e3ea"/>
      <rect x="${browserX + 44}" y="${browserY + 455}" width="326" height="9" rx="5" fill="#1fca91"/>
      <rect x="${browserX + 524}" y="${browserY + 104}" width="74" height="326" rx="37" fill="#eff8fb" stroke="#d2e4ed" stroke-width="2"/>
      ${controlButton(browserX + 561, browserY + 145, '#319fe2', 'up')}
      <rect x="${browserX + 540}" y="${browserY + 187}" width="42" height="70" rx="21" fill="#d2e3ea"/>
      <rect x="${browserX + 540}" y="${browserY + 218}" width="42" height="39" rx="21" fill="#1fca91"/>
      ${text(browserX + 561, browserY + 211, '62%', { size: 14, weight: 850, fill: '#15364b', anchor: 'middle' })}
      ${controlButton(browserX + 561, browserY + 291, '#f0a23b', 'bookmark')}
      ${controlButton(browserX + 561, browserY + 365, '#7659d6', 'outline')}
      ${controlButton(browserX + 561, browserY + 439, '#1ca972', 'down')}
    `
  );
}

function domainControlSvg() {
  return base(
    '一个主域名，四项开关',
    '在工具栏 Popup 中立即控制插件与三项高级功能',
    `
      <g>
        ${roundedCard(72, 234, 468, 478, { radius: 30 })}
        <image x="104" y="263" width="42" height="42" href="data:image/png;base64,${ICON_DATA}"/>
        ${text(164, 294, '当前网站：example.com', { size: 22, weight: 800, fill: '#18354b' })}
        <line x1="104" y1="326" x2="508" y2="326" stroke="#dbe7ed" stroke-width="2"/>
        ${text(106, 370, '在此主域名启用插件', { size: 21, weight: 750, fill: '#243d4f' })}
        ${toggle(430, 346, true)}
        ${text(106, 420, '高级功能', { size: 15, weight: 850, fill: '#78909f' })}
        <rect x="102" y="442" width="408" height="60" rx="16" fill="#f5f9fb"/>
        ${text(124, 480, '页面进度条', { size: 20, weight: 700, fill: '#284252' })}
        ${toggle(430, 455, true)}
        <rect x="102" y="514" width="408" height="60" rx="16" fill="#f5f9fb"/>
        ${text(124, 552, '滚动位置书签', { size: 20, weight: 700, fill: '#284252' })}
        ${toggle(430, 527, false)}
        <rect x="102" y="586" width="408" height="60" rx="16" fill="#f5f9fb"/>
        ${text(124, 624, '智能段落跳转', { size: 20, weight: 700, fill: '#284252' })}
        ${toggle(430, 599, true)}
        <rect x="102" y="664" width="408" height="26" rx="13" fill="#e8eef2"/>
        ${text(306, 683, '打开设置', { size: 15, weight: 750, fill: '#526876', anchor: 'middle' })}
      </g>
      <g>
        ${text(632, 270, '同一主域名，共享一套状态', { size: 34, weight: 820 })}
        <rect x="632" y="310" width="528" height="142" rx="26" fill="#ffffff" opacity="0.1" stroke="#7ee4d0" stroke-width="2"/>
        ${pill(662, 336, 214, 'docs.example.com', { fill: '#e6f7ff', textFill: '#124c67', size: 17 })}
        ${pill(896, 336, 224, 'app.example.com', { fill: '#e6f7ff', textFill: '#124c67', size: 17 })}
        <path d="M 768 395 C 768 430, 896 430, 896 395" fill="none" stroke="#74e7ca" stroke-width="3" stroke-linecap="round"/>
        ${pill(794, 408, 210, 'example.com', { fill: '#74e7ca', textFill: '#092f3a', size: 18 })}
        <g transform="translate(632 500)">
          <circle cx="17" cy="17" r="17" fill="#1fca91"/>
          <path d="M 9 17 L 15 23 L 26 10" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          ${text(52, 24, '切换后当前页面立即更新', { size: 23, weight: 720 })}
          <circle cx="17" cy="81" r="17" fill="#50bff3"/>
          <path d="M 17 7 V 27 M 7 17 H 27" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          ${text(52, 88, '子域名和不同页面无需重复设置', { size: 23, weight: 720 })}
          <circle cx="17" cy="145" r="17" fill="#f0a23b"/>
          <path d="M 17 7 V 19 L 25 25" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/>
          ${text(52, 152, '主域名状态仅保存在本地', { size: 23, weight: 720 })}
        </g>
      </g>
    `
  );
}

function readingToolsSvg() {
  return base(
    '进度条 + 书签 + 智能段落跳转',
    '掌握阅读进度、保存位置，按章节快速穿梭长文章',
    `
      <g>
        ${roundedCard(72, 230, 360, 490, { radius: 30 })}
        <rect x="72" y="230" width="360" height="82" rx="30" fill="#e5f7ff"/>
        <rect x="72" y="282" width="360" height="30" fill="#e5f7ff"/>
        <circle cx="116" cy="271" r="24" fill="#319fe2"/>
        <rect x="106" y="252" width="20" height="38" rx="10" fill="#ffffff" opacity="0.35"/>
        <rect x="106" y="268" width="20" height="22" rx="10" fill="#ffffff"/>
        ${text(154, 280, '页面进度条', { size: 25, weight: 820, fill: '#174b68' })}
        ${pill(104, 340, 296, '当前阅读进度 62%', { fill: '#c9efff', textFill: '#0b587b', size: 19 })}
        ${text(104, 430, '纵向进度按钮', { size: 18, weight: 780, fill: '#284252' })}
        <rect x="104" y="452" width="296" height="70" rx="24" fill="#eff8fb" stroke="#d2e4ed" stroke-width="2"/>
        <circle cx="140" cy="487" r="25" fill="#319fe2"/>
        <path d="M 140 470 L 126 488 H 134 V 503 H 146 V 488 H 154 Z" fill="#ffffff"/>
        <rect x="184" y="468" width="82" height="38" rx="19" fill="#d2e3ea"/>
        <rect x="184" y="484" width="51" height="22" rx="11" fill="#1fca91"/>
        ${text(318, 495, '62%', { size: 20, weight: 850, fill: '#15364b', anchor: 'middle' })}
        ${text(104, 566, '横向页面边缘进度条', { size: 18, weight: 780, fill: '#284252' })}
        <rect x="104" y="590" width="296" height="14" rx="7" fill="#dce6eb"/>
        <rect x="104" y="590" width="184" height="14" rx="7" fill="#1fca91"/>
        <circle cx="116" cy="650" r="7" fill="#1fca91"/>
        ${text(136, 657, '显示百分比', { size: 17, weight: 690, fill: '#526b79' })}
        <circle cx="270" cy="650" r="7" fill="#50bff3"/>
        ${text(290, 657, '点击跳转', { size: 17, weight: 690, fill: '#526b79' })}
      </g>
      <g>
        ${roundedCard(460, 230, 360, 490, { radius: 30 })}
        <rect x="460" y="230" width="360" height="82" rx="30" fill="#fff5dd"/>
        <rect x="460" y="282" width="360" height="30" fill="#fff5dd"/>
        <circle cx="504" cy="271" r="24" fill="#f0a23b"/>
        ${bookmarkIcon(504, 271)}
        ${text(542, 280, '滚动位置书签', { size: 25, weight: 820, fill: '#59421b' })}
        ${text(492, 360, '产品文档', { size: 22, weight: 800, fill: '#284252' })}
        ${text(492, 393, '安装与配置', { size: 17, weight: 650, fill: '#738795' })}
        <rect x="492" y="424" width="296" height="14" rx="7" fill="#dce6eb"/>
        <rect x="492" y="424" width="184" height="14" rx="7" fill="url(#warm)"/>
        ${pill(492, 462, 296, '已保存至页面 62%', { fill: '#fff0cf', textFill: '#7b4d00', size: 18 })}
        <rect x="492" y="536" width="296" height="88" rx="20" fill="#fff8e9"/>
        ${text(516, 568, '再次打开页面时', { size: 16, weight: 700, fill: '#866d42' })}
        ${text(516, 598, '自动加载 / 提示恢复 / 手动加载', { size: 17, weight: 760, fill: '#684d1c' })}
        ${pill(492, 650, 142, '保存位置', { fill: '#f0a23b', textFill: '#ffffff' })}
        ${pill(646, 650, 142, '加载书签', { fill: '#fff0cf', textFill: '#7b4d00' })}
      </g>
      <g>
        ${roundedCard(848, 230, 360, 490, { radius: 30 })}
        <rect x="848" y="230" width="360" height="82" rx="30" fill="#eee9ff"/>
        <rect x="848" y="282" width="360" height="30" fill="#eee9ff"/>
        <circle cx="892" cy="271" r="24" fill="#7659d6"/>
        ${outlineIcon(892, 271)}
        ${text(930, 280, '智能段落跳转', { size: 25, weight: 820, fill: '#3f3268' })}
        <rect x="880" y="340" width="296" height="64" rx="18" fill="#f7f5ff"/>
        <circle cx="904" cy="372" r="7" fill="#7659d6"/>
        ${text(924, 380, '1. 快速开始', { size: 18, weight: 780, fill: '#3f3268' })}
        <rect x="880" y="416" width="296" height="56" rx="16" fill="#f5f9fb"/>
        <circle cx="904" cy="444" r="6" fill="#a7b8c3"/>
        ${text(924, 452, '2. 按主域名启用功能', { size: 17, weight: 690, fill: '#405767' })}
        <rect x="880" y="484" width="296" height="56" rx="16" fill="#f5f9fb"/>
        <circle cx="904" cy="512" r="6" fill="#a7b8c3"/>
        ${text(924, 520, '3. 自定义页面进度条', { size: 17, weight: 690, fill: '#405767' })}
        <rect x="880" y="552" width="296" height="56" rx="16" fill="#f5f9fb"/>
        <circle cx="904" cy="580" r="6" fill="#a7b8c3"/>
        ${text(924, 588, '4. 隐私与匿名统计', { size: 17, weight: 690, fill: '#405767' })}
        ${pill(880, 650, 90, '上一段', { fill: '#e9eef2', textFill: '#4d6270', size: 16 })}
        ${pill(978, 650, 90, '下一段', { fill: '#7659d6', textFill: '#ffffff', size: 16 })}
        ${pill(1076, 650, 100, '章节高亮', { fill: '#eee9ff', textFill: '#51328a', size: 15 })}
      </g>
    `
  );
}

function onboardingPrivacySvg() {
  return base(
    '开箱即用，也尊重你的选择',
    '全新安装提供快速开始，匿名统计始终默认关闭',
    `
      <g>
        ${roundedCard(72, 230, 680, 490, { radius: 30 })}
        <image x="108" y="266" width="54" height="54" href="data:image/png;base64,${ICON_DATA}"/>
        ${text(184, 298, '快速开始', { size: 31, weight: 840, fill: '#18354b' })}
        ${text(108, 357, '1', { size: 20, weight: 850, fill: '#08293b', anchor: 'middle' })}
        <circle cx="108" cy="350" r="24" fill="#74e7ca"/>
        ${text(108, 357, '1', { size: 20, weight: 850, fill: '#08293b', anchor: 'middle' })}
        ${text(150, 358, '使用页面边缘按钮快速到顶或到底', { size: 21, weight: 720, fill: '#284252' })}
        <circle cx="108" cy="422" r="24" fill="#8edcff"/>
        ${text(108, 429, '2', { size: 20, weight: 850, fill: '#08293b', anchor: 'middle' })}
        ${text(150, 430, '从工具栏 Popup 按主域名启用高级功能', { size: 21, weight: 720, fill: '#284252' })}
        <circle cx="108" cy="494" r="24" fill="#ffd98a"/>
        ${text(108, 501, '3', { size: 20, weight: 850, fill: '#513900', anchor: 'middle' })}
        ${text(150, 502, '在设置页细调按钮、进度与阅读工具', { size: 21, weight: 720, fill: '#284252' })}
        <rect x="108" y="554" width="608" height="102" rx="22" fill="#f2f8fb"/>
        ${text(136, 589, '首次安装后自动打开一次设置页', { size: 20, weight: 780, fill: '#24475b' })}
        ${text(136, 622, '升级、浏览器重启或扩展重载不会重复打扰。', { size: 17, weight: 620, fill: '#718592' })}
        ${pill(108, 674, 166, '知道了', { fill: '#319fe2', textFill: '#ffffff' })}
        ${text(296, 702, '之后可从“关于插件”重新查看', { size: 16, weight: 650, fill: '#718592' })}
      </g>
      <g>
        ${roundedCard(788, 230, 420, 300, { radius: 30 })}
        ${text(824, 278, '隐私与统计', { size: 27, weight: 830, fill: '#18354b' })}
        ${text(824, 320, '发送匿名使用统计', { size: 20, weight: 750, fill: '#284252' })}
        ${toggle(1114, 296, false)}
        ${pill(824, 350, 152, '默认关闭', { fill: '#e9eef2', textFill: '#526876' })}
        ${text(824, 420, '不会发送', { size: 16, weight: 850, fill: '#78909f' })}
        ${text(824, 454, '网址、域名、页面内容、书签内容', { size: 18, weight: 720, fill: '#405767' })}
        ${text(824, 486, '或长期用户 ID', { size: 18, weight: 720, fill: '#405767' })}
      </g>
      <g>
        ${roundedCard(788, 560, 420, 160, { radius: 30 })}
        ${text(824, 608, '更新记录', { size: 25, weight: 830, fill: '#18354b' })}
        ${pill(1070, 582, 102, 'v2.1.0', { fill: '#dff8ff', textFill: '#0b4863', size: 16 })}
        <circle cx="832" cy="650" r="6" fill="#1fca91"/>
        ${text(850, 657, '扩展内即可查看新功能与优化', { size: 18, weight: 720, fill: '#405767' })}
        <circle cx="832" cy="688" r="6" fill="#50bff3"/>
        ${text(850, 695, '所有记录均随扩展离线提供', { size: 18, weight: 720, fill: '#405767' })}
      </g>
    `
  );
}

const smallPromoLocales = {
  'zh-CN': {
    title: '智能页面滚动导航器',
    subtitle: '长页面快速定位',
    features: ['一键到达顶部 / 底部', '页面进度与点击跳转', '滚动位置书签', '智能段落跳转'],
    titleSize: 21,
    featureSize: 14
  },
  'zh-TW': {
    title: '智慧頁面捲動導覽器',
    subtitle: '長頁面快速定位',
    features: ['一鍵到達頂部 / 底部', '頁面進度與點擊跳轉', '捲動位置書籤', '智慧段落跳轉'],
    titleSize: 21,
    featureSize: 14
  },
  en: {
    title: 'Smart Scroll Navigator',
    subtitle: 'Navigate long pages faster',
    features: ['Jump to top / bottom', 'Progress and click to jump', 'Scroll position bookmarks', 'Smart section navigation'],
    titleSize: 20,
    featureSize: 12
  },
  es: {
    title: 'Navegador Scroll Inteligente',
    subtitle: 'Navega páginas largas',
    features: ['Ir al inicio / final', 'Progreso y salto por clic', 'Marcadores de posición', 'Navegación por secciones'],
    titleSize: 17,
    featureSize: 12
  },
  ja: {
    title: 'スマートスクロールナビ',
    subtitle: '長いページをすばやく移動',
    features: ['ページ上部 / 下部へ移動', '進捗表示とクリック移動', 'スクロール位置を保存', 'スマート見出し移動'],
    titleSize: 19,
    featureSize: 12
  },
  de: {
    title: 'Intelligente Scroll-Navigation',
    subtitle: 'Lange Seiten schnell navigieren',
    features: ['Zum Anfang / Ende springen', 'Fortschritt und Klicksprung', 'Scrollposition speichern', 'Intelligente Abschnittsnavigation'],
    titleSize: 17,
    featureSize: 11
  },
  fr: {
    title: 'Navigation de défilement',
    subtitle: 'Parcourez les longues pages',
    features: ['Aller en haut / en bas', 'Progression et saut par clic', 'Signets de position', 'Navigation par sections'],
    titleSize: 18,
    featureSize: 12
  },
  pt: {
    title: 'Navegador de Rolagem',
    subtitle: 'Navegue páginas longas',
    features: ['Ir ao topo / fim', 'Progresso e salto por clique', 'Favoritos de posição', 'Navegação por seções'],
    titleSize: 19,
    featureSize: 11
  },
  ko: {
    title: '스마트 스크롤 내비게이터',
    subtitle: '긴 페이지 빠르게 탐색',
    features: ['맨 위 / 아래로 이동', '진행률 및 클릭 이동', '스크롤 위치 북마크', '스마트 섹션 이동'],
    titleSize: 19,
    featureSize: 13
  },
  it: {
    title: 'Navigatore di scorrimento',
    subtitle: 'Naviga pagine lunghe',
    features: ['Vai all’inizio / fine', 'Avanzamento e salto con clic', 'Segnalibri di posizione', 'Navigazione per sezioni'],
    titleSize: 18,
    featureSize: 11
  }
};

function smallPromoSvg(locale) {
  const featureY = [122, 164, 206, 248];
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <defs>
    <linearGradient id="promoBackground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f0f9ff"/>
      <stop offset="0.56" stop-color="#eaf8f2"/>
      <stop offset="1" stop-color="#fff6df"/>
    </linearGradient>
    <linearGradient id="titleBackground" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0b2b40"/>
      <stop offset="1" stop-color="#08706a"/>
    </linearGradient>
    <filter id="promoShadow" x="-40%" y="-40%" width="180%" height="190%">
      <feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="#24415d" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="440" height="280" fill="url(#promoBackground)"/>
  <rect width="440" height="76" fill="url(#titleBackground)"/>
  <image x="24" y="17" width="42" height="42" href="data:image/png;base64,${ICON_DATA}"/>
  ${text(80, 45, locale.title, { size: locale.titleSize, weight: 850 })}
  ${text(80, 65, locale.subtitle, { size: 12, weight: 650, fill: '#9edfd2' })}

  <circle cx="420" cy="118" r="92" fill="#4a9edd" opacity="0.07"/>
  <circle cx="16" cy="278" r="92" fill="#25a967" opacity="0.08"/>

  <g>
    <rect x="24" y="99" width="190" height="34" rx="12" fill="#ffffff" opacity="0.8"/>
    <circle cx="42" cy="116" r="5" fill="#319fe2"/>
    ${text(56, featureY[0], locale.features[0], { size: locale.featureSize, weight: 720, fill: '#324f60' })}
    <rect x="24" y="141" width="190" height="34" rx="12" fill="#ffffff" opacity="0.8"/>
    <circle cx="42" cy="158" r="5" fill="#1fca91"/>
    ${text(56, featureY[1], locale.features[1], { size: locale.featureSize, weight: 720, fill: '#324f60' })}
    <rect x="24" y="183" width="190" height="34" rx="12" fill="#ffffff" opacity="0.8"/>
    <circle cx="42" cy="200" r="5" fill="#f0a23b"/>
    ${text(56, featureY[2], locale.features[2], { size: locale.featureSize, weight: 720, fill: '#324f60' })}
    <rect x="24" y="225" width="190" height="34" rx="12" fill="#ffffff" opacity="0.8"/>
    <circle cx="42" cy="242" r="5" fill="#7659d6"/>
    ${text(56, featureY[3], locale.features[3], { size: locale.featureSize, weight: 720, fill: '#324f60' })}
  </g>

  <g filter="url(#promoShadow)">
    <rect x="238" y="99" width="178" height="160" rx="25" fill="#ffffff"/>
    <rect x="254" y="115" width="146" height="25" rx="13" fill="#edf5f8"/>
    <circle cx="269" cy="128" r="4" fill="#ff6b6b"/>
    <circle cx="282" cy="128" r="4" fill="#ffc857"/>
    <circle cx="295" cy="128" r="4" fill="#48c78e"/>
    <rect x="258" y="156" width="79" height="7" rx="4" fill="#18354b"/>
    <rect x="258" y="177" width="111" height="6" rx="3" fill="#dce9f1"/>
    <rect x="258" y="195" width="98" height="6" rx="3" fill="#dce9f1"/>
    <rect x="258" y="231" width="111" height="7" rx="4" fill="#d7e3ea"/>
    <rect x="258" y="231" width="68" height="7" rx="4" fill="#1fca91"/>
  </g>

  <g filter="url(#promoShadow)">
    <rect x="344" y="140" width="61" height="110" rx="30" fill="#eff8fb" stroke="#d2e4ed" stroke-width="1.5"/>
    <circle cx="374.5" cy="166" r="23" fill="#319fe2"/>
    <path d="M 374.5 151 L 362 167 H 369 V 180 H 380 V 167 H 387 Z" fill="#ffffff"/>
    <circle cx="374.5" cy="221" r="23" fill="#1ca972"/>
    <path d="M 374.5 236 L 362 220 H 369 V 207 H 380 V 220 H 387 Z" fill="#ffffff"/>
  </g>

  <circle cx="253" cy="227" r="17" fill="#f0a23b" filter="url(#promoShadow)"/>
  <path d="M 245 217 H 261 V 237 L 253 232 L 245 237 Z" fill="#ffffff"/>
  <circle cx="297" cy="227" r="17" fill="#7659d6" filter="url(#promoShadow)"/>
  <circle cx="291" cy="221" r="2" fill="#ffffff"/>
  <circle cx="291" cy="227" r="2" fill="#ffffff"/>
  <circle cx="291" cy="233" r="2" fill="#ffffff"/>
  <path d="M 297 221 H 305 M 297 227 H 305 M 297 233 H 305" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
</svg>`;
}

function marqueePromoSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs>
    <linearGradient id="promoBackground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#071a2a"/>
      <stop offset="0.58" stop-color="#0c3044"/>
      <stop offset="1" stop-color="#07615d"/>
    </linearGradient>
    <linearGradient id="promoWarm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd166"/>
      <stop offset="1" stop-color="#ff8e6e"/>
    </linearGradient>
    <filter id="promoShadow" x="-30%" y="-30%" width="160%" height="180%">
      <feDropShadow dx="0" dy="20" stdDeviation="18" flood-color="#020b12" flood-opacity="0.35"/>
    </filter>
    <filter id="promoSmallShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#071a2a" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="1400" height="560" fill="url(#promoBackground)"/>
  <circle cx="1260" cy="36" r="275" fill="#50d7ff" opacity="0.09"/>
  <circle cx="65" cy="560" r="255" fill="#1fca91" opacity="0.1"/>
  <path d="M 0 475 C 310 410, 490 570, 790 490 S 1160 410, 1400 470 V 560 H 0 Z" fill="#ffffff" opacity="0.035"/>

  <g>
    <rect x="76" y="70" width="74" height="74" rx="21" fill="#ffffff" filter="url(#promoShadow)"/>
    <image x="89" y="83" width="48" height="48" href="data:image/png;base64,${ICON_DATA}"/>
    ${text(174, 99, '智能页面滚动导航器', { size: 39, weight: 860 })}
    ${text(176, 136, 'Smart Scroll Navigator · V2.1', { size: 17, weight: 780, fill: '#74e7ca' })}
    ${text(76, 218, '长页面，一路顺畅', { size: 54, weight: 880 })}
    ${text(78, 264, '顶部/底部跳转、页面进度、书签与智能段落导航', { size: 25, weight: 620, fill: '#b8d5df' })}
    ${pill(78, 314, 158, '一键到顶 / 到底', { fill: '#dff8ff', textFill: '#0b4863', size: 16 })}
    ${pill(250, 314, 132, '进度跳转', { fill: '#ddf8ed', textFill: '#086149', size: 16 })}
    ${pill(396, 314, 132, '位置书签', { fill: '#fff1cf', textFill: '#7b4d00', size: 16 })}
    ${pill(542, 314, 146, '段落导航', { fill: '#f0e9ff', textFill: '#51328a', size: 16 })}
    <rect x="78" y="388" width="610" height="82" rx="22" fill="#ffffff" opacity="0.09" stroke="#74e7ca" stroke-width="1.5"/>
    <circle cx="112" cy="420" r="7" fill="#74e7ca"/>
    ${text(132, 427, '按主域名控制插件与三项高级功能', { size: 20, weight: 730 })}
    <circle cx="112" cy="450" r="7" fill="#50bff3"/>
    ${text(132, 457, '适配文章、文档、Wiki、Notion 与 SPA 页面', { size: 20, weight: 730 })}
  </g>

  <g filter="url(#promoShadow)">
    <rect x="750" y="66" width="572" height="430" rx="30" fill="#ffffff"/>
    <rect x="750" y="66" width="572" height="68" rx="30" fill="#eaf2f8"/>
    <rect x="750" y="110" width="572" height="24" fill="#eaf2f8"/>
    <circle cx="784" cy="99" r="8" fill="#ff6b6b"/>
    <circle cx="810" cy="99" r="8" fill="#ffc857"/>
    <circle cx="836" cy="99" r="8" fill="#48c78e"/>
    <rect x="876" y="84" width="386" height="30" rx="15" fill="#ffffff"/>
    ${text(900, 105, 'docs.example.com/guide', { size: 15, weight: 550, fill: '#6d7e8b' })}
    <rect x="792" y="174" width="220" height="20" rx="10" fill="#18354b"/>
    <rect x="792" y="220" width="380" height="12" rx="6" fill="#dce9f1"/>
    <rect x="792" y="252" width="428" height="12" rx="6" fill="#dce9f1"/>
    <rect x="792" y="284" width="350" height="12" rx="6" fill="#dce9f1"/>
    <rect x="792" y="316" width="404" height="12" rx="6" fill="#dce9f1"/>
    <rect x="792" y="360" width="176" height="17" rx="9" fill="#486477"/>
    <rect x="792" y="400" width="404" height="12" rx="6" fill="#dce9f1"/>
    <rect x="792" y="458" width="454" height="9" rx="5" fill="#d7e3ea"/>
    <rect x="792" y="458" width="281" height="9" rx="5" fill="#1fca91"/>
  </g>

  <g filter="url(#promoSmallShadow)">
    <rect x="1216" y="174" width="76" height="270" rx="38" fill="#eff8fb" stroke="#d2e4ed" stroke-width="2"/>
    <circle cx="1254" cy="214" r="31" fill="#319fe2"/>
    <path d="M 1254 193 L 1236 216 H 1247 V 233 H 1261 V 216 H 1272 Z" fill="#ffffff"/>
    <rect x="1233" y="253" width="42" height="66" rx="21" fill="#d2e3ea"/>
    <rect x="1233" y="280" width="42" height="39" rx="21" fill="#1fca91"/>
    ${text(1254, 274, '62%', { size: 13, weight: 850, fill: '#15364b', anchor: 'middle' })}
    <circle cx="1254" cy="351" r="31" fill="#f0a23b"/>
    <path d="M 1241 332 H 1267 V 371 L 1254 362 L 1241 371 Z" fill="#ffffff"/>
    <circle cx="1254" cy="414" r="31" fill="#7659d6"/>
    <circle cx="1242" cy="403" r="3" fill="#ffffff"/>
    <circle cx="1242" cy="414" r="3" fill="#ffffff"/>
    <circle cx="1242" cy="425" r="3" fill="#ffffff"/>
    <path d="M 1250 403 H 1267 M 1250 414 H 1267 M 1250 425 H 1267" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  </g>
  <circle cx="1254" cy="476" r="31" fill="#1ca972" filter="url(#promoSmallShadow)"/>
  <path d="M 1254 497 L 1236 474 H 1247 V 457 H 1261 V 474 H 1272 Z" fill="#ffffff"/>
</svg>`;
}

const assets = [
  ['zh-CN-v2.1-01-overview', overviewSvg()],
  ['zh-CN-v2.1-02-domain-control', domainControlSvg()],
  ['zh-CN-v2.1-03-reading-tools', readingToolsSvg()],
  ['zh-CN-v2.1-04-onboarding-privacy', onboardingPrivacySvg()]
];

const largeScreenshotSourceText = {
  overview: [
    '长页面，一路顺畅',
    '顶部/底部跳转、页面进度、书签与智能段落导航',
    '一键到顶 / 到底',
    '进度点击跳转',
    '阅读位置书签',
    '智能段落跳转',
    '适合文章、文档、Wiki、Notion',
    '以及需要频繁滚动的长页面。',
    '智能识别页面与自定义滚动容器',
    '支持 SPA 页面动态内容与章节更新'
  ],
  domain: [
    '一个主域名，四项开关',
    '在工具栏 Popup 中立即控制插件与三项高级功能',
    '当前网站：example.com',
    '在此主域名启用插件',
    '高级功能',
    '页面进度条',
    '滚动位置书签',
    '智能段落跳转',
    '打开设置',
    '同一主域名，共享一套状态',
    '切换后当前页面立即更新',
    '子域名和不同页面无需重复设置',
    '主域名状态仅保存在本地'
  ],
  reading: [
    '进度条 + 书签 + 智能段落跳转',
    '掌握阅读进度、保存位置，按章节快速穿梭长文章',
    '页面进度条',
    '当前阅读进度 62%',
    '纵向进度按钮',
    '横向页面边缘进度条',
    '显示百分比',
    '点击跳转',
    '滚动位置书签',
    '产品文档',
    '安装与配置',
    '已保存至页面 62%',
    '再次打开页面时',
    '自动加载 / 提示恢复 / 手动加载',
    '保存位置',
    '加载书签',
    '智能段落跳转',
    '1. 快速开始',
    '2. 按主域名启用功能',
    '3. 自定义页面进度条',
    '4. 隐私与匿名统计',
    '上一段',
    '下一段',
    '章节高亮'
  ],
  onboarding: [
    '开箱即用，也尊重你的选择',
    '全新安装提供快速开始，匿名统计始终默认关闭',
    '快速开始',
    '使用页面边缘按钮快速到顶或到底',
    '从工具栏 Popup 按主域名启用高级功能',
    '在设置页细调按钮、进度与阅读工具',
    '首次安装后自动打开一次设置页',
    '升级、浏览器重启或扩展重载不会重复打扰。',
    '知道了',
    '之后可从“关于插件”重新查看',
    '隐私与统计',
    '发送匿名使用统计',
    '默认关闭',
    '不会发送',
    '网址、域名、页面内容、书签内容',
    '或长期用户 ID',
    '更新记录',
    '扩展内即可查看新功能与优化',
    '所有记录均随扩展离线提供'
  ]
};

const marqueeSourceText = [
  '智能页面滚动导航器',
  '长页面，一路顺畅',
  '顶部/底部跳转、页面进度、书签与智能段落导航',
  '一键到顶 / 到底',
  '进度跳转',
  '位置书签',
  '段落导航',
  '按主域名控制插件与三项高级功能',
  '适配文章、文档、Wiki、Notion 与 SPA 页面'
];

const marqueeFeatureLabels = {
  'zh-TW': ['頂部 / 底部', '進度跳轉', '位置書籤', '段落導覽'],
  en: ['Top / bottom', 'Progress jump', 'Bookmarks', 'Smart sections'],
  es: ['Inicio / final', 'Salto por progreso', 'Marcadores', 'Secciones'],
  ja: ['上部 / 下部', '進捗ジャンプ', 'ブックマーク', '見出し移動'],
  de: ['Anfang / Ende', 'Fortschrittssprung', 'Lesezeichen', 'Abschnitte'],
  fr: ['Haut / bas', 'Saut par progression', 'Signets', 'Sections'],
  pt: ['Topo / fim', 'Salto por progresso', 'Favoritos', 'Seções'],
  ko: ['맨 위 / 아래', '진행률 이동', '북마크', '섹션 이동'],
  it: ['Inizio / fine', 'Salto avanzamento', 'Segnalibri', 'Sezioni']
};

function textWidthUnits(value) {
  return Array.from(value).reduce((total, character) => {
    return total + (/[\u2e80-\uffff]/.test(character) ? 1 : 0.56);
  }, 0);
}

function localizeLargeSvg(svg, sourceText, translatedText) {
  if (sourceText.length !== translatedText.length) {
    throw new Error(`Localization text count mismatch: ${sourceText.length} !== ${translatedText.length}`);
  }

  return sourceText.reduce((localizedSvg, sourceValue, index) => {
    const targetValue = translatedText[index];
    const escapedSource = sourceValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(<text\\b[^>]*font-size=")([\\d.]+)("[^>]*>)${escapedSource}(</text>)`, 'g');

    return localizedSvg.replace(pattern, (match, prefix, fontSize, suffix, closingTag) => {
      const originalSize = Number(fontSize);
      const sourceUnits = textWidthUnits(sourceValue);
      const targetUnits = textWidthUnits(targetValue);
      const fittedSize = targetUnits > sourceUnits
        ? Math.max(11, Math.min(originalSize, originalSize * (sourceUnits / targetUnits) * 1.12))
        : originalSize;
      return `${prefix}${fittedSize.toFixed(1)}${suffix}${escapeXml(targetValue)}${closingTag}`;
    });
  }, svg);
}

async function main() {
  const outputFiles = [];

  for (const [name, svg] of assets) {
    const svgPath = path.join(SOURCE_DIR, `${name}.svg`);
    const pngPath = path.join(OUTPUT_DIR, `${name}.png`);
    fs.writeFileSync(svgPath, svg, 'utf8');
    await sharp(Buffer.from(svg), { density: 192 })
      .resize(WIDTH, HEIGHT, { fit: 'fill' })
      .png()
      .toFile(pngPath);
    outputFiles.push(pngPath);
    console.log(pngPath);
  }

  const largeTemplates = [
    ['01-overview', 'overview', overviewSvg()],
    ['02-domain-control', 'domain', domainControlSvg()],
    ['03-reading-tools', 'reading', readingToolsSvg()],
    ['04-onboarding-privacy', 'onboarding', onboardingPrivacySvg()]
  ];
  const localizedLargeAssets = [];

  for (const [localeCode, localeCopy] of Object.entries(storeScreenshotLocales)) {
    for (const [suffix, copyKey, templateSvg] of largeTemplates) {
      const name = `${localeCode}-v2.1-${suffix}`;
      const localizedSvg = localizeLargeSvg(
        templateSvg,
        largeScreenshotSourceText[copyKey],
        localeCopy[copyKey]
      );
      const svgPath = path.join(SOURCE_DIR, `${name}.svg`);
      const pngPath = path.join(OUTPUT_DIR, `${name}.png`);
      fs.writeFileSync(svgPath, localizedSvg, 'utf8');
      await sharp(Buffer.from(localizedSvg), { density: 192 })
        .resize(WIDTH, HEIGHT, { fit: 'fill' })
        .png()
        .toFile(pngPath);
      localizedLargeAssets.push({ localeCode, suffix, pngPath });
      console.log(pngPath);
    }
  }

  for (const [suffix] of largeTemplates) {
    const matchingAssets = localizedLargeAssets.filter((asset) => asset.suffix === suffix);
    const previewBuffers = await Promise.all(matchingAssets.map(async (asset) => ({
      input: await sharp(asset.pngPath)
        .resize(400, 250, { fit: 'fill' })
        .png()
        .toBuffer()
    })));
    const sheetPath = path.join(OUTPUT_DIR, `all-locales-${suffix}.png`);
    await sharp({
      create: {
        width: 1220,
        height: 770,
        channels: 4,
        background: '#dbe7ec'
      }
    })
      .composite(previewBuffers.map((preview, index) => ({
        input: preview.input,
        left: 10 + (index % 3) * 405,
        top: 10 + Math.floor(index / 3) * 255
      })))
      .png()
      .toFile(sheetPath);
    console.log(sheetPath);
  }

  const smallPromoAssets = Object.entries(smallPromoLocales).map(([localeCode, locale]) => [
    `${localeCode}-v2.1-small-promo-440x280`,
    smallPromoSvg(locale),
    440,
    280
  ]);
  const promoAssets = [
    ...smallPromoAssets,
    ['zh-CN-v2.1-marquee-promo-1400x560', marqueePromoSvg(), 1400, 560]
  ];

  const localizedMarqueeAssets = [];
  for (const [localeCode, localeCopy] of Object.entries(storeScreenshotLocales)) {
    const smallPromoCopy = smallPromoLocales[localeCode];
    const marqueeCopy = [
      smallPromoCopy.title,
      localeCopy.overview[0],
      localeCopy.overview[1],
      ...marqueeFeatureLabels[localeCode],
      localeCopy.domain[1],
      `${localeCopy.overview[6]} · SPA`
    ];
    const name = `${localeCode}-v2.1-marquee-promo-1400x560`;
    promoAssets.push([
      name,
      localizeLargeSvg(marqueePromoSvg(), marqueeSourceText, marqueeCopy),
      1400,
      560
    ]);
    localizedMarqueeAssets.push(name);
  }

  for (const [name, svg, width, height] of promoAssets) {
    const svgPath = path.join(SOURCE_DIR, `${name}.svg`);
    const pngPath = path.join(OUTPUT_DIR, `${name}.png`);
    fs.writeFileSync(svgPath, svg, 'utf8');
    await sharp(Buffer.from(svg), { density: 192 })
      .resize(width, height, { fit: 'fill' })
      .png()
      .toFile(pngPath);
    console.log(pngPath);
  }

  const marqueePreviewBuffers = await Promise.all(localizedMarqueeAssets.map(async (name) => ({
    input: await sharp(path.join(OUTPUT_DIR, `${name}.png`))
      .resize(700, 280, { fit: 'fill' })
      .png()
      .toBuffer()
  })));
  const marqueeSheet = path.join(OUTPUT_DIR, 'marquee-promo-1400x560-all-locales.png');
  await sharp({
    create: {
      width: 1420,
      height: 1430,
      channels: 4,
      background: '#dbe7ec'
    }
  })
    .composite(marqueePreviewBuffers.map((preview, index) => ({
      input: preview.input,
      left: 10 + (index % 2) * 710,
      top: 10 + Math.floor(index / 2) * 285
    })))
    .png()
    .toFile(marqueeSheet);
  console.log(marqueeSheet);

  const smallPromoBuffers = await Promise.all(
    smallPromoAssets.map(async ([name]) => ({
      input: await sharp(path.join(OUTPUT_DIR, `${name}.png`))
        .resize(440, 280, { fit: 'fill' })
        .png()
        .toBuffer()
    }))
  );
  const smallPromoSheet = path.join(OUTPUT_DIR, 'small-promo-440x280-all-locales.png');
  await sharp({
    create: {
      width: 1360,
      height: 1480,
      channels: 4,
      background: '#dbe7ec'
    }
  })
    .composite(smallPromoBuffers.map((item, index) => ({
      input: item.input,
      left: 10 + (index % 3) * 450,
      top: 10 + Math.floor(index / 3) * 290
    })))
    .png()
    .toFile(smallPromoSheet);
  console.log(smallPromoSheet);

  const thumbs = await Promise.all(outputFiles.map(async (file) => ({
    input: await sharp(file).resize(608, 380, { fit: 'fill' }).png().toBuffer()
  })));
  const contactSheet = path.join(OUTPUT_DIR, 'zh-CN-v2.1-contact-sheet.png');
  await sharp({
    create: {
      width: 1280,
      height: 828,
      channels: 4,
      background: '#061724'
    }
  })
    .composite(thumbs.map((thumb, index) => ({
      input: thumb.input,
      left: index % 2 === 0 ? 24 : 648,
      top: index < 2 ? 24 : 424
    })))
    .png()
    .toFile(contactSheet);
  console.log(contactSheet);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
