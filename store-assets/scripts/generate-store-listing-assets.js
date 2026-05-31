const fs = require('fs');
const path = require('path');
const sharp = require('/Users/gemingming/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE_DIR = path.join(ROOT, 'store-assets', 'sources');
const SCREENSHOT_DIR = path.join(ROOT, 'store-assets', 'screenshots');
const PROMO_DIR = path.join(ROOT, 'store-assets', 'promotional');
const ICON_DATA = fs.readFileSync(path.join(ROOT, 'icons', 'icon128.png')).toString('base64');

fs.mkdirSync(SOURCE_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.mkdirSync(PROMO_DIR, { recursive: true });

const locales = {
  en: {
    localeCode: 'en',
    name: 'Smart Scroll Navigator',
    title: 'Smart Scroll Navigator',
    subtitle: 'Top, bottom, progress, smart jumps',
    bullets: ['Page-edge scroll controls', 'Reading progress with click-to-jump', 'Per-site enable switch'],
    overviewFeatures: ['Top / bottom jump buttons', 'Vertical reading progress', 'Click progress to jump', 'Horizontal progress bar', 'Per-site enable switch'],
    chips: ['Top / bottom', 'Progress jump', 'Site control'],
    settingsTitle: 'Customize long-page navigation',
    settingsSubtitle: 'Tune buttons, progress display, shortcuts, and site behavior',
    settingsHeader: 'Smart Scroll Navigator Settings',
    labels: ['Scroll speed', 'Button size', 'Progress bar', 'Site status'],
    sideChips: ['Vertical or edge progress', 'Click progress to jump', 'Custom icons and colors', 'Fullscreen auto-hide', 'SPA scroll detection'],
    footer: 'For docs, wikis, and long pages.',
    url: 'example.com/long-article'
  },
  'zh-CN': {
    localeCode: 'zh-CN',
    name: '智能页面滚动导航器',
    title: '智能页面滚动导航器',
    subtitle: '顶部/底部跳转、阅读进度与长页面快速定位',
    bullets: ['页面边缘浮动控制', '阅读进度显示与点击跳转', '按网站启用或停用'],
    overviewFeatures: ['顶部/底部跳转按钮', '纵向阅读进度显示', '点击进度条快速跳转', '横向页面进度条', '按网站启用或停用'],
    chips: ['顶部/底部', '进度跳转', '站点控制'],
    settingsTitle: '按你的浏览习惯定制长页面导航',
    settingsSubtitle: '按钮、进度条、快捷键和网站状态都可以细调',
    settingsHeader: '智能页面滚动导航器 设置',
    labels: ['滚动速度', '按钮尺寸', '页面进度条', '网站状态'],
    sideChips: ['纵向/横向进度条', '点击进度快速跳转', '自定义图标和颜色', '全屏自动隐藏', 'SPA 滚动容器检测'],
    footer: '适合文章、文档、Wiki、Notion 和长看板。',
    url: 'example.com/长页面文章'
  },
  es: {
    localeCode: 'es',
    name: 'Navegador Scroll Inteligente',
    title: 'Navegador Scroll Inteligente',
    subtitle: 'Inicio, final, progreso y saltos rapidos',
    bullets: ['Controles flotantes en el borde', 'Progreso de lectura con salto por clic', 'Activacion por sitio web'],
    overviewFeatures: ['Botones de inicio y final', 'Progreso vertical de lectura', 'Clic en progreso para saltar', 'Barra horizontal de progreso', 'Activacion por sitio web'],
    chips: ['Inicio / final', 'Salto por progreso', 'Control por sitio'],
    settingsTitle: 'Personaliza la navegacion en paginas largas',
    settingsSubtitle: 'Ajusta botones, progreso, atajos y comportamiento por sitio',
    settingsHeader: 'Ajustes de Navegador Scroll Inteligente',
    labels: ['Velocidad', 'Tamano del boton', 'Barra de progreso', 'Estado del sitio'],
    sideChips: ['Progreso vertical u horizontal', 'Clic en progreso para saltar', 'Iconos y colores personalizados', 'Ocultar en pantalla completa', 'Deteccion de contenedor SPA'],
    footer: 'Para articulos, docs, wikis, Notion y paneles.',
    url: 'example.com/articulo-largo'
  },
  ja: {
    localeCode: 'ja',
    name: 'スマートスクロールナビ',
    title: 'スマートスクロールナビ',
    subtitle: '上下移動、進捗表示、クリック移動で快適に',
    bullets: ['ページ端のフローティング操作', '読書進捗とクリックジャンプ', 'サイトごとの有効化設定'],
    overviewFeatures: ['上/下へ移動ボタン', '縦型の読書進捗表示', '進捗クリックで移動', '横型ページ進捗バー', 'サイトごとの有効化'],
    chips: ['上/下へ移動', '進捗ジャンプ', 'サイト制御'],
    settingsTitle: '長いページのナビゲーションをカスタマイズ',
    settingsSubtitle: 'ボタン、進捗バー、ショートカット、サイト設定を調整',
    settingsHeader: 'スマートスクロールナビ 設定',
    labels: ['スクロール速度', 'ボタンサイズ', 'ページ進捗バー', 'サイト状態'],
    sideChips: ['縦/横の進捗バー', '進捗クリックで移動', 'アイコンと色を変更', '全画面で自動非表示', 'SPA スクロール検出'],
    footer: '記事、文書、Wiki、Notion、長い画面に最適。',
    url: 'example.com/long-page'
  }
};

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function text({ x, y, value, size = 30, weight = 600, fill = '#102033', anchor = 'start', opacity = 1 }) {
  return `<text x="${x}" y="${y}" font-family="system-ui, -apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans, Yu Gothic, Microsoft YaHei, Helvetica Neue, Arial, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}">${esc(value)}</text>`;
}

function multiline(lines, x, y, opts = {}) {
  const gap = opts.gap || Math.round((opts.size || 30) * 1.55);
  return lines.map((line, i) => text({ ...opts, x, y: y + i * gap, value: line })).join('\n');
}

function chip(x, y, label, color = '#0d7cc1') {
  const width = Math.max(150, Array.from(label).length * 12 + 42);
  return `
    <rect x="${x}" y="${y}" width="${width}" height="44" rx="22" fill="${color}" opacity="0.1"/>
    <circle cx="${x + 24}" cy="${y + 22}" r="6" fill="${color}"/>
    ${text({ x: x + 42, y: y + 29, value: label, size: 18, weight: 700, fill: color })}
  `;
}

function arrowGlyph(cx, cy, dir) {
  const d = dir === 'up'
    ? `M ${cx} ${cy - 18} L ${cx - 18} ${cy + 6} H ${cx - 7} V ${cy + 20} H ${cx + 7} V ${cy + 6} H ${cx + 18} Z`
    : `M ${cx} ${cy + 18} L ${cx - 18} ${cy - 6} H ${cx - 7} V ${cy - 20} H ${cx + 7} V ${cy - 6} H ${cx + 18} Z`;
  return `<path d="${d}" fill="#ffffff"/>`;
}

function arrowButton(cx, cy, dir, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="34" fill="${fill}"/>${arrowGlyph(cx, cy, dir)}`;
}

function progressControl(x, y) {
  return `
    <rect x="${x}" y="${y}" width="68" height="226" rx="34" fill="#f4fbff" stroke="#c9dfea" stroke-width="2"/>
    ${arrowButton(x + 34, y + 42, 'up', '#4a9edd')}
    <rect x="${x + 12}" y="${y + 84}" width="44" height="86" rx="22" fill="#d8e5ef"/>
    <rect x="${x + 12}" y="${y + 118}" width="44" height="52" rx="22" fill="#25a967"/>
    ${text({ x: x + 34, y: y + 112, value: '58%', size: 15, weight: 800, fill: '#18324a', anchor: 'middle' })}
    ${arrowButton(x + 34, y + 190, 'down', '#25a967')}
  `;
}

function browserMockup(x, y, width, height, locale) {
  const lines = Array.from({ length: 12 }, (_, i) => {
    const yy = y + 116 + i * 31;
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
      ${text({ x: x + 152, y: y + 40, value: locale.url, size: 16, fill: '#5d7187', weight: 500 })}
      <rect x="${x + 52}" y="${y + 100}" width="230" height="20" rx="10" fill="#2a3c52"/>
      ${lines}
      <rect x="${x + 52}" y="${y + height - 42}" width="${width - 104}" height="8" rx="4" fill="#d8e5ef"/>
      <rect x="${x + 52}" y="${y + height - 42}" width="${Math.round((width - 104) * 0.58)}" height="8" rx="4" fill="#25a967"/>
      ${progressControl(x + width - 110, y + 124)}
    </g>
  `;
}

function settingsMockup(x, y, locale) {
  return `
    <g filter="url(#softShadow)">
      <rect x="${x}" y="${y}" width="620" height="480" rx="20" fill="#ffffff"/>
      <rect x="${x}" y="${y}" width="620" height="72" rx="20" fill="#eef5fb"/>
      <rect x="${x}" y="${y + 50}" width="620" height="22" fill="#eef5fb"/>
      <image x="${x + 30}" y="${y + 20}" width="32" height="32" href="data:image/png;base64,${ICON_DATA}"/>
      ${text({ x: x + 78, y: y + 44, value: locale.settingsHeader, size: 22, weight: 760, fill: '#23384c' })}
      ${locale.labels.map((label, i) => {
        const yy = y + 116 + i * 76;
        const colors = ['#4a9edd', '#25a967', '#f1a43a', '#7b61ff'];
        const widths = [250, 310, 230, 340];
        return `
          ${text({ x: x + 44, y: yy, value: label, size: 20, weight: 700, fill: '#2a3c52' })}
          <rect x="${x + 44}" y="${yy + 22}" width="390" height="10" rx="5" fill="#dce9f2"/>
          <rect x="${x + 44}" y="${yy + 22}" width="${widths[i]}" height="10" rx="5" fill="${colors[i]}"/>
          <circle cx="${x + 44 + widths[i]}" cy="${yy + 27}" r="14" fill="#ffffff" stroke="${colors[i]}" stroke-width="4"/>
        `;
      }).join('')}
      <rect x="${x + 462}" y="${y + 112}" width="112" height="268" rx="16" fill="#f6fafc" stroke="#d7e6ef"/>
      ${progressControl(x + 484, y + 134)}
      <rect x="${x + 44}" y="${y + 398}" width="172" height="46" rx="23" fill="#4a9edd"/>
      ${text({ x: x + 130, y: y + 428, value: locale.localeCode === 'en' ? 'Save settings' : locale.localeCode === 'zh-CN' ? '保存设置' : locale.localeCode === 'es' ? 'Guardar' : '保存', size: 18, weight: 750, fill: '#ffffff', anchor: 'middle' })}
    </g>
  `;
}

function defs() {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f7fbff"/>
        <stop offset="0.46" stop-color="#ecf7f3"/>
        <stop offset="1" stop-color="#fff9ec"/>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="18" flood-color="#24415d" flood-opacity="0.16"/>
      </filter>
    </defs>
  `;
}

function frame(width, height, inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${defs()}
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="${width - 160}" cy="110" r="210" fill="#4a9edd" opacity="0.08"/>
  <circle cx="80" cy="${height - 80}" r="230" fill="#25a967" opacity="0.08"/>
  ${inner}
</svg>`;
}

function overview(locale) {
  const titleSize = locale.localeCode === 'es' ? 43 : locale.localeCode === 'ja' ? 46 : locale.localeCode === 'zh-CN' ? 48 : 46;
  const subtitleSize = locale.localeCode === 'es' || locale.localeCode === 'ja' ? 24 : 26;
  const featureTitle = locale.localeCode === 'zh-CN'
    ? '核心能力'
    : locale.localeCode === 'es'
      ? 'Funciones clave'
      : locale.localeCode === 'ja'
        ? '主な機能'
        : 'Key Features';
  return frame(1280, 800, `
    <image x="80" y="70" width="78" height="78" href="data:image/png;base64,${ICON_DATA}"/>
    ${text({ x: 178, y: 110, value: locale.title, size: titleSize, weight: 850, fill: '#18324a' })}
    ${text({ x: 180, y: 154, value: locale.subtitle, size: subtitleSize, weight: 650, fill: '#2d617b' })}
    ${browserMockup(80, 235, 610, 470, locale)}
    ${text({ x: 770, y: 238, value: featureTitle, size: 34, weight: 850, fill: '#18324a' })}
    ${locale.overviewFeatures.map((label, i) => {
      const colors = ['#0d7cc1', '#4a9edd', '#25a967', '#7b61ff', '#d64f7f'];
      const yy = 270 + i * 82;
      return `
        <g filter="url(#softShadow)">
          <rect x="770" y="${yy}" width="430" height="62" rx="18" fill="#ffffff" opacity="0.97"/>
          <circle cx="804" cy="${yy + 31}" r="10" fill="${colors[i]}"/>
          ${text({ x: 830, y: yy + 39, value: label, size: locale.localeCode === 'es' ? 20 : 22, weight: 780, fill: '#21384e' })}
        </g>
      `;
    }).join('\n')}
  `);
}

function settings(locale) {
  const chipTextSize = locale.localeCode === 'es' ? 19 : locale.localeCode === 'ja' ? 18 : locale.localeCode === 'zh-CN' ? 20 : 20;
  const footerSize = locale.localeCode === 'es' ? 22 : locale.localeCode === 'ja' ? 22 : 24;
  return frame(1280, 800, `
    ${text({ x: 80, y: 118, value: locale.settingsTitle, size: locale.localeCode === 'es' ? 40 : 44, weight: 850, fill: '#18324a' })}
    ${text({ x: 82, y: 164, value: locale.settingsSubtitle, size: locale.localeCode === 'ja' ? 24 : 27, weight: 650, fill: '#2d617b' })}
    ${settingsMockup(80, 230, locale)}
    <g transform="translate(780 236)">
      ${locale.sideChips.map((label, i) => {
        const color = ['#0d7cc1', '#25a967', '#f1a43a', '#7b61ff', '#d64f7f'][i];
        const yy = i * 72;
        return `
          <rect x="0" y="${yy}" width="390" height="44" rx="22" fill="${color}" opacity="0.11"/>
          <circle cx="24" cy="${yy + 22}" r="6" fill="${color}"/>
          ${text({ x: 42, y: yy + 29, value: label, size: chipTextSize, weight: 750, fill: color })}
        `;
      }).join('\n')}
    </g>
    <g>
      <rect x="750" y="628" width="480" height="58" rx="18" fill="#ffffff" opacity="0.72"/>
      ${text({ x: 776, y: 665, value: locale.footer, size: footerSize, weight: 760, fill: '#263b50' })}
    </g>
  `);
}

function smallPromo() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280" viewBox="0 0 440 280">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#edf8ff"/>
      <stop offset="0.55" stop-color="#ecf8f0"/>
      <stop offset="1" stop-color="#fff7e7"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#24415d" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="440" height="280" fill="url(#bg)"/>
  <circle cx="376" cy="36" r="96" fill="#4a9edd" opacity="0.12"/>
  <circle cx="32" cy="256" r="108" fill="#25a967" opacity="0.12"/>
  <g filter="url(#shadow)">
    <rect x="126" y="44" width="254" height="184" rx="18" fill="#ffffff"/>
    <rect x="126" y="44" width="254" height="34" rx="18" fill="#eef5fb"/>
    <rect x="126" y="66" width="254" height="12" fill="#eef5fb"/>
    <circle cx="146" cy="61" r="4.5" fill="#ff6b6b"/>
    <circle cx="161" cy="61" r="4.5" fill="#ffc857"/>
    <circle cx="176" cy="61" r="4.5" fill="#4cc38a"/>
    <rect x="154" y="94" width="96" height="8" rx="4" fill="#2a3c52"/>
    <rect x="154" y="118" width="160" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="154" y="138" width="178" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="154" y="158" width="134" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="154" y="178" width="168" height="7" rx="3.5" fill="#d8e8f2"/>
    <rect x="154" y="202" width="174" height="6" rx="3" fill="#d8e5ef"/>
    <rect x="154" y="202" width="102" height="6" rx="3" fill="#25a967"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="58" y="78" width="104" height="104" rx="22" fill="#ffffff"/>
    <image x="78" y="98" width="64" height="64" href="data:image/png;base64,${ICON_DATA}"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="326" y="78" width="44" height="142" rx="22" fill="#f4fbff" stroke="#c9dfea" stroke-width="1.5"/>
    <circle cx="348" cy="108" r="18" fill="#4a9edd"/>
    <path d="M348 96 L336 112 H343 V122 H353 V112 H360 Z" fill="#ffffff"/>
    <rect x="334" y="134" width="28" height="56" rx="14" fill="#d8e5ef"/>
    <rect x="334" y="134" width="28" height="42" rx="14" fill="#25a967"/>
    <circle cx="348" cy="202" r="18" fill="#25a967"/>
    <path d="M348 214 L336 198 H343 V188 H353 V198 H360 Z" fill="#ffffff"/>
  </g>
</svg>`;
}

function marqueePromo() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#edf8ff"/>
      <stop offset="0.55" stop-color="#ecf8f0"/>
      <stop offset="1" stop-color="#fff7e7"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#24415d" flood-opacity="0.17"/>
    </filter>
  </defs>
  <rect width="1400" height="560" fill="url(#bg)"/>
  <circle cx="1230" cy="78" r="238" fill="#4a9edd" opacity="0.11"/>
  <circle cx="112" cy="514" r="220" fill="#25a967" opacity="0.11"/>
  <g filter="url(#shadow)">
    <rect x="120" y="154" width="190" height="190" rx="38" fill="#ffffff"/>
    <image x="160" y="194" width="110" height="110" href="data:image/png;base64,${ICON_DATA}"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="392" y="88" width="720" height="386" rx="32" fill="#ffffff"/>
    <rect x="392" y="88" width="720" height="72" rx="32" fill="#eef5fb"/>
    <rect x="392" y="132" width="720" height="28" fill="#eef5fb"/>
    <circle cx="430" cy="124" r="12" fill="#ff6b6b"/>
    <circle cx="466" cy="124" r="12" fill="#ffc857"/>
    <circle cx="502" cy="124" r="12" fill="#4cc38a"/>
    <rect x="548" y="111" width="480" height="28" rx="14" fill="#ffffff"/>
    <rect x="470" y="198" width="260" height="18" rx="9" fill="#2a3c52"/>
    <rect x="470" y="244" width="510" height="14" rx="7" fill="#d8e8f2"/>
    <rect x="470" y="284" width="560" height="14" rx="7" fill="#d8e8f2"/>
    <rect x="470" y="324" width="430" height="14" rx="7" fill="#d8e8f2"/>
    <rect x="470" y="364" width="520" height="14" rx="7" fill="#d8e8f2"/>
    <rect x="470" y="424" width="560" height="10" rx="5" fill="#d8e5ef"/>
    <rect x="470" y="424" width="328" height="10" rx="5" fill="#25a967"/>
  </g>
  <g filter="url(#shadow)">
    <rect x="1048" y="156" width="78" height="264" rx="39" fill="#f4fbff" stroke="#c9dfea" stroke-width="3"/>
    <circle cx="1087" cy="202" r="34" fill="#4a9edd"/>
    ${arrowGlyph(1087, 202, 'up')}
    <rect x="1062" y="254" width="50" height="82" rx="25" fill="#d8e5ef"/>
    <rect x="1062" y="298" width="50" height="38" rx="25" fill="#25a967"/>
    <circle cx="1087" cy="374" r="34" fill="#25a967"/>
    ${arrowGlyph(1087, 374, 'down')}
  </g>
  <g filter="url(#shadow)" opacity="0.96">
    <rect x="1154" y="192" width="132" height="132" rx="28" fill="#ffffff"/>
    <path d="M1194 242 H1246" stroke="#4a9edd" stroke-width="10" stroke-linecap="round"/>
    <path d="M1220 216 V268" stroke="#25a967" stroke-width="10" stroke-linecap="round"/>
    <circle cx="1220" cy="242" r="52" fill="none" stroke="#d8e5ef" stroke-width="10"/>
    <path d="M1220 190 A52 52 0 0 1 1266 266" fill="none" stroke="#25a967" stroke-width="10" stroke-linecap="round"/>
  </g>
</svg>`;
}

async function writePng(svg, outputPath, width, height) {
  await sharp(Buffer.from(svg), { density: 192 })
    .resize(width, height, { fit: 'fill' })
    .png()
    .toFile(outputPath);
  console.log(outputPath);
}

async function main() {
  for (const locale of Object.values(locales)) {
    const base = locale.localeCode;
    const images = [
      [`${base}-01-overview`, overview(locale)],
      [`${base}-02-settings`, settings(locale)]
    ];
    for (const [name, svg] of images) {
      fs.writeFileSync(path.join(SOURCE_DIR, `${name}.svg`), svg, 'utf8');
      await writePng(svg, path.join(SCREENSHOT_DIR, `${name}.png`), 1280, 800);
    }
  }

  const small = smallPromo();
  fs.writeFileSync(path.join(SOURCE_DIR, 'small-promo-440x280.svg'), small, 'utf8');
  await writePng(small, path.join(PROMO_DIR, 'small-promo-440x280.png'), 440, 280);

  const marquee = marqueePromo();
  fs.writeFileSync(path.join(SOURCE_DIR, 'marquee-promo-1400x560.svg'), marquee, 'utf8');
  await writePng(marquee, path.join(PROMO_DIR, 'marquee-promo-1400x560.png'), 1400, 560);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
