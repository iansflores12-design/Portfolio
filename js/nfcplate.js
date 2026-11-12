// La placa NFC de la agencia, en matriz de puntos: un teléfono se acerca a la placa del
// mostrador, la placa "lee" y arriba se enciende una fila de estrellas punto por punto.
// Mismo motor que la portada: los puntos cerca del cursor se apartan y toman el acento.
// Solo anima mientras está en pantalla; con movimiento reducido queda el cuadro final.

const COLS = 48;
const ROWS = 20;

const STAR = ['0001000', '0001000', '1111111', '0111110', '0011100', '0110110', '1100011'];
const STARS_Y = 1;
const STAR_GAP = 2;
const STARS_X = Math.floor((COLS - (5 * 7 + 4 * STAR_GAP)) / 2);

const PLATE = { x: 30, y: 10, w: 14, h: 10 };
// El teléfono termina pegado a la placa (una columna de aire) para que se lean los dos.
const PHONE = { w: 7, h: 11, y: 9, from: 3, to: PLATE.x - 7 - 1 };

// Tiempos (ms) de cada fase del ciclo.
const T_MOVE = 1500;
const T_READ = 700;
const T_STARS = 1500;
const T_HOLD = 2200;
const CYCLE = T_MOVE + T_READ + T_STARS + T_HOLD;

const ease = (t) => 1 - (1 - t) ** 3;

function rectOutline({ x, y, w, h }, set) {
  for (let i = x; i < x + w; i += 1) { set.add(`${i},${y}`); set.add(`${i},${y + h - 1}`); }
  for (let j = y; j < y + h; j += 1) { set.add(`${x},${j}`); set.add(`${x + w - 1},${j}`); }
  return set;
}

// Placa: borde, símbolo NFC (tres arcos) y un mini QR.
function buildPlate() {
  const border = rectOutline(PLATE, new Set());
  const inner = new Set();
  const cx = PLATE.x + 3;
  const cy = PLATE.y + 3;
  const arcs = [[0, 0], [1, -1], [1, 0], [1, 1], [2, -2], [2, -1], [2, 0], [2, 1], [2, 2]];
  for (const [dx, dy] of arcs) inner.add(`${cx + dx},${cy + dy}`);
  const qr = ['1110111', '1010001', '1110101', '0001011', '1101110'];
  qr.forEach((row, j) => [...row].forEach((bit, i) => {
    if (bit === '1') inner.add(`${PLATE.x + 6 + i},${PLATE.y + 2 + j}`);
  }));
  return { border, inner };
}

// Estrellas en el orden en que se encienden: de izquierda a derecha, columna por columna.
function buildStars() {
  const dots = [];
  for (let s = 0; s < 5; s += 1) {
    const ox = STARS_X + s * (7 + STAR_GAP);
    STAR.forEach((row, j) => [...row].forEach((bit, i) => {
      if (bit === '1') dots.push(`${ox + i},${STARS_Y + j}`);
    }));
  }
  return dots.sort((a, b) => Number(a.split(',')[0]) - Number(b.split(',')[0]));
}

export function initNfcPlate(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const plate = buildPlate();
  const stars = buildStars();
  const starSlots = new Set(stars);
  let size = { cell: 0, ratio: 1 };
  let colors = {};
  let pointer = null;
  let visible = false;
  let raf = 0;
  let t0 = performance.now();
  let elapsed = reduced ? T_MOVE + T_READ + T_STARS : 0;

  function readColors() {
    const style = getComputedStyle(document.documentElement);
    colors = {
      off: style.getPropertyValue('--dot-off').trim(),
      on: style.getPropertyValue('--fg').trim(),
      dim: style.getPropertyValue('--line-strong').trim(),
      accent: style.getPropertyValue('--accent').trim(),
    };
  }

  function frameState(ms) {
    const moveT = ease(Math.min(1, ms / T_MOVE));
    const phoneX = Math.round(PHONE.from + (PHONE.to - PHONE.from) * moveT);
    const reading = ms >= T_MOVE && ms < T_MOVE + T_READ;
    const starsT = Math.max(0, Math.min(1, (ms - T_MOVE - T_READ) / T_STARS));
    const litStars = new Set(stars.slice(0, Math.round(starsT * stars.length)));
    // Pulso de lectura: la placa parpadea dos veces.
    const blink = reading && Math.floor(((ms - T_MOVE) / T_READ) * 4) % 2 === 0;
    return { phoneX, reading, blink, litStars, done: ms >= T_MOVE + T_READ };
  }

  function draw() {
    const { cell, ratio } = size;
    if (!cell) return;
    const s = frameState(elapsed);
    const phone = rectOutline({ x: s.phoneX, y: PHONE.y, w: PHONE.w, h: PHONE.h }, new Set());
    const speaker = new Set([`${s.phoneX + 2},${PHONE.y + 1}`, `${s.phoneX + 3},${PHONE.y + 1}`, `${s.phoneX + 4},${PHONE.y + 1}`]);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const reach = cell * 2.6;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        const key = `${x},${y}`;
        let fill = colors.off;
        let r = 0.18;
        if (starSlots.has(key)) {
          if (s.litStars.has(key)) { fill = colors.on; r = 0.42; } else { fill = colors.dim; r = 0.22; }
        }
        if (plate.border.has(key)) { fill = s.blink ? colors.accent : colors.on; r = 0.38; }
        if (plate.inner.has(key)) { fill = s.done || s.blink ? colors.accent : colors.dim; r = 0.3; }
        if (phone.has(key) || speaker.has(key)) { fill = colors.on; r = 0.4; }

        let cx = (x + 0.5) * cell;
        let cy = (y + 0.5) * cell;
        let radius = cell * r;
        if (pointer) {
          const dx = cx - pointer.x;
          const dy = cy - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < reach) {
            const force = 1 - distance / reach;
            cx += (dx / distance) * force * cell * 0.35;
            cy += (dy / distance) * force * cell * 0.35;
            radius = Math.max(radius, cell * (0.18 + force * 0.24));
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

  function loop(now) {
    raf = 0;
    elapsed = (now - t0) % CYCLE;
    draw();
    if (visible) raf = requestAnimationFrame(loop);
  }

  function schedule() {
    if (reduced || !visible) { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); return; }
    if (!raf) raf = requestAnimationFrame(loop);
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    size = { cell: rect.width / COLS, ratio };
    draw();
  }

  readColors();
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('site:theme', () => { readColors(); draw(); });

  new IntersectionObserver(([entry]) => {
    const was = visible;
    visible = entry.isIntersecting;
    if (visible && !was && !reduced) { t0 = performance.now(); schedule(); }
  }).observe(canvas);

  const track = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    schedule();
  };
  const clear = () => { pointer = null; schedule(); };
  canvas.addEventListener('pointermove', track);
  canvas.addEventListener('pointerleave', clear);
  canvas.addEventListener('pointercancel', clear);
  // Tocar la placa reinicia la animación.
  canvas.addEventListener('pointerdown', (event) => {
    track(event);
    if (!reduced) t0 = performance.now();
  });
  canvas.addEventListener('pointerup', (event) => { if (event.pointerType !== 'mouse') clear(); });
}
