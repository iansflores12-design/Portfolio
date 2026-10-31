// Los bloques se descifran glifo por glifo al entrar en pantalla, en una ola desde el
// centro. Idea tomada de ascii-reveal (React); esta versión está escrita para este sitio.
// Sin guiones ni barras entre los glifos: el navegador corta líneas ahí y el texto saltaría.
const GLYPHS = '#%@*+=:.';
const PANELS = '.kv, .stats, .card, .setup-card, .rec-box, .terminal, .form, .glass-wrap';
const HEADINGS = '.sec-head h2, .sub-h';
const INNER_TEXT = 'h3, h4, .rec-head strong, .post-title, .stats strong, .kv dt';
const CELL_W = 12;
const CELL_H = 20;

const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

export function decodeText(element, duration = 650) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.textContent.trim()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const final = node.textContent;
    const center = final.length / 2;
    const reach = Math.max(1, center);
    const order = [...final].map((_, index) => (Math.abs(index - center) / reach) * 0.75 + Math.random() * 0.25);
    const start = performance.now();
    const step = (now) => {
      const progress = (now - start) / duration;
      if (progress >= 1) { node.textContent = final; return; }
      node.textContent = [...final].map((char, index) => (char.trim() === '' || progress > order[index] ? char : randomGlyph())).join('');
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}

function solidBackground(element) {
  const color = getComputedStyle(element).backgroundColor;
  const empty = color === 'transparent' || color === 'rgba(0, 0, 0, 0)';
  return empty ? getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() : color;
}

function decodePanel(element) {
  const rect = element.getBoundingClientRect();
  const overlay = document.createElement('canvas');
  overlay.className = 'decode-layer';
  overlay.setAttribute('aria-hidden', 'true');
  const ratio = Math.min(devicePixelRatio || 1, 1.25);
  overlay.width = Math.round(rect.width * ratio);
  overlay.height = Math.round(rect.height * ratio);
  element.classList.add('decoding');
  element.append(overlay);

  const ctx = overlay.getContext('2d');
  const fg = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
  const background = solidBackground(element);
  const cols = Math.ceil(rect.width / CELL_W);
  const rows = Math.ceil(rect.height / CELL_H);
  const cells = [];
  const span = Math.hypot(cols / 2, rows / 2) || 1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const distance = Math.hypot(col - cols / 2, row - rows / 2) / span;
      cells.push({ col, row, at: distance * 0.82 + Math.random() * 0.1 });
    }
  }
  ctx.scale(ratio, ratio);
  ctx.font = "11px 'JetBrains Mono', ui-monospace, monospace";
  ctx.textBaseline = 'top';

  const duration = Math.min(620, 380 + rows * 6);
  const start = performance.now();
  const step = (now) => {
    const progress = (now - start) / duration;
    if (progress >= 1) {
      overlay.remove();
      element.classList.remove('decoding');
      return;
    }
    ctx.clearRect(0, 0, rect.width, rect.height);
    // Todo el fondo va en un solo trazo; fillText solo en el frente de la ola, que es lo que se ve.
    ctx.beginPath();
    for (const cell of cells) {
      if (cell.at - progress >= -0.06) ctx.rect(cell.col * CELL_W, cell.row * CELL_H, CELL_W + 0.5, CELL_H + 0.5);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = background;
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.globalAlpha = 0.9;
    for (const cell of cells) {
      const ahead = cell.at - progress;
      if (ahead >= -0.06 && ahead < 0.1) ctx.fillText(randomGlyph(), cell.col * CELL_W + 2, cell.row * CELL_H + 3);
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initDecode() {
  // WebGL no admite hijos: cada panel de vidrio necesita un contenedor para llevar la capa.
  for (const canvas of document.querySelectorAll('canvas.glass')) {
    const wrap = document.createElement('div');
    wrap.className = 'glass-wrap';
    canvas.before(wrap);
    wrap.append(canvas);
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      if (element.matches(PANELS)) {
        element.classList.remove('decode-wait');
        decodePanel(element);
        element.querySelectorAll(INNER_TEXT).forEach((text) => decodeText(text, 800));
      } else {
        decodeText(element);
      }
    }
  }, { rootMargin: '0px 0px -4% 0px' });

  for (const panel of document.querySelectorAll(PANELS)) {
    panel.classList.add('decode-wait');
    observer.observe(panel);
  }
  document.querySelectorAll(HEADINGS).forEach((heading) => observer.observe(heading));
  // La frase de la portada ya está a la vista: se descifra al cargar.
  const tag = document.querySelector('.hero-tag [data-i18n]');
  if (tag) decodeText(tag, 900);
}
