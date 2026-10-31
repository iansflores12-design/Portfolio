// El nombre de la portada en matriz de puntos. Los puntos cerca del cursor se encienden
// con el acento y se apartan; el resto del tiempo no corre ningún bucle de animación.
const GLYPHS = {
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
};
const COLS = 31;
const ROWS = 11;
const PAD = 2;

function buildLit() {
  const lit = new Set();
  let x = PAD;
  for (const letter of 'IAN F') {
    if (letter === ' ') { x += 2; continue; }
    GLYPHS[letter].forEach((row, y) => {
      [...row].forEach((bit, dx) => { if (bit === '1') lit.add(`${x + dx},${y + PAD}`); });
    });
    x += 6;
  }
  return { lit, period: `${x},${PAD + 6}` };
}

export function initDotMatrix(canvas) {
  const ctx = canvas.getContext('2d');
  const { lit, period } = buildLit();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let size = { cell: 0, ratio: 1 };
  let colors = {};
  let pointer = null;
  let frame = 0;
  let reveal = reduced ? COLS : 0;

  function readColors() {
    const style = getComputedStyle(document.documentElement);
    colors = {
      off: style.getPropertyValue('--dot-off').trim(),
      on: style.getPropertyValue('--fg').trim(),
      accent: style.getPropertyValue('--accent').trim(),
    };
  }

  function draw() {
    const { cell, ratio } = size;
    if (!cell) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const reach = cell * 2.6;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const key = `${x},${y}`;
        const isPeriod = key === period;
        const on = (lit.has(key) || isPeriod) && x < reveal;
        let cx = (x + 0.5) * cell;
        let cy = (y + 0.5) * cell;
        let radius = cell * (on ? 0.42 : 0.2);
        let fill = isPeriod && on ? colors.accent : on ? colors.on : colors.off;
        if (pointer) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < reach) {
            const force = 1 - distance / reach;
            cx += (dx / distance) * force * cell * 0.35;
            cy += (dy / distance) * force * cell * 0.35;
            radius = Math.max(radius, cell * (0.2 + force * 0.24));
            if (force > 0.2) fill = colors.accent;
          }
        }
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    size = { cell: rect.width / COLS, ratio };
    draw();
  }

  new ResizeObserver(resize).observe(canvas);
  readColors();
  document.addEventListener('site:theme', () => { readColors(); draw(); });

  if (!reduced) {
    const track = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      schedule();
    };
    const clear = () => { pointer = null; schedule(); };
    canvas.addEventListener('pointermove', track);
    canvas.addEventListener('pointerdown', track);
    canvas.addEventListener('pointerleave', clear);
    canvas.addEventListener('pointercancel', clear);
    canvas.addEventListener('pointerup', (event) => { if (event.pointerType !== 'mouse') clear(); });

    // Se enciende columna por columna al cargar.
    const start = performance.now();
    const step = (now) => {
      reveal = Math.min(COLS, ((now - start) / 450) * COLS);
      draw();
      if (reveal < COLS) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}
