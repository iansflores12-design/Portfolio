// Una pantalla de 1 bit al estilo del Macintosh original, vista de cerca y en perspectiva.
// Se pinta una sola vez y luego solo se mueve con CSS: el navegador la compone sin repintar.
const WIDTH = 400;
const HEIGHT = 230;
const PIXEL = 6;
const GAP = 1;

const FONT = {
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  V: ['10001', '10001', '10001', '10001', '01010', '01010', '00100'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  i: ['01000', '00000', '11000', '01000', '01000', '01000', '11100'],
  l: ['11000', '01000', '01000', '01000', '01000', '01000', '11100'],
  e: ['00000', '00000', '01110', '10001', '11111', '10000', '01111'],
  d: ['00001', '00001', '01111', '10001', '10001', '10001', '01111'],
  t: ['01000', '01000', '11110', '01000', '01000', '01001', '00110'],
  w: ['00000', '00000', '10001', '10001', '10101', '10101', '01010'],
  o: ['00000', '00000', '01110', '10001', '10001', '10001', '01110'],
  s: ['00000', '00000', '01111', '10000', '01110', '00001', '11110'],
  y: ['00000', '00000', '10001', '10001', '01111', '00001', '01110'],
  n: ['00000', '00000', '10110', '11001', '10001', '10001', '10001'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00110', '01000', '10000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
};

const APPLE = [
  '00000000110',
  '00000011100',
  '00000110000',
  '01111011110',
  '11111111111',
  '11111111110',
  '11111111100',
  '11111111100',
  '11111111110',
  '01111111111',
  '00111111110',
  '00011001100',
];

function buildBitmap() {
  const bits = new Uint8Array(WIDTH * HEIGHT);
  const set = (x, y) => { if (x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT) bits[y * WIDTH + x] = 1; };
  const hline = (x, y, length, step = 1) => { for (let i = 0; i < length; i += step) set(x + i, y); };
  const vline = (x, y, length) => { for (let i = 0; i < length; i += 1) set(x, y + i); };
  const rect = (x, y, w, h) => { hline(x, y, w); hline(x, y + h - 1, w); vline(x, y, h); vline(x + w - 1, y, h); };
  const fill = (x, y, w, h) => { for (let i = 0; i < h; i += 1) hline(x, y + i, w); };
  const checker = (x, y, w, h) => {
    for (let j = 0; j < h; j += 1) for (let i = 0; i < w; i += 1) if ((i + j) % 2 === 0) set(x + i, y + j);
  };
  const text = (value, x, y, scale = 1) => {
    let cursor = x;
    for (const char of value) {
      if (char === ' ') { cursor += 4 * scale; continue; }
      FONT[char].forEach((row, j) => [...row].forEach((bit, i) => { if (bit === '1') fill(cursor + i * scale, y + j * scale, scale, scale); }));
      cursor += 6 * scale;
    }
  };
  const triangleBox = (x, y) => {
    rect(x, y, 26, 15);
    fill(x + 26, y + 2, 2, 15);
    fill(x + 2, y + 15, 26, 2);
    for (let i = 0; i < 6; i += 1) {
      set(x + 13 - i, y + 4 + i);
      set(x + 13 + i, y + 4 + i);
    }
    hline(x + 7, y + 10, 13);
  };

  // Barra de menú.
  APPLE.forEach((row, j) => [...row].forEach((bit, i) => { if (bit === '1') set(14 + i, 1 + j); }));
  text('File', 42, 3);
  text('Edit', 78, 3);
  text('View', 114, 3);
  text('Goodies', 150, 3);
  text('Style', 204, 3);
  text('Font', 246, 3);

  // Ventana con borde de trama, como en el MacWrite de 1984.
  const [wx, wy, ww, wh] = [8, 18, 384, 206];
  checker(wx, wy, ww, 3);
  checker(wx, wy, 3, wh);
  checker(wx + ww - 3, wy, 3, wh);
  checker(wx, wy + wh - 3, ww, 3);

  // Barra de título: rayas, casilla de cierre y más rayas.
  for (let i = 0; i < 5; i += 1) hline(wx + 7, wy + 6 + i * 2, 16);
  rect(wx + 27, wy + 5, 13, 11);
  for (let i = 0; i < 5; i += 1) hline(wx + 44, wy + 6 + i * 2, ww - 52);

  checker(wx + 3, wy + 19, ww - 6, 2);
  hline(wx + 3, wy + 22, ww - 6);
  checker(wx + 3, wy + 24, ww - 6, 2);

  // Regla con números, marcas y tabuladores.
  const rulerY = wy + 40;
  text('1', wx + 14, wy + 29, 2);
  text('2', wx + 124, wy + 29, 2);
  text('3', wx + 234, wy + 29, 2);
  text('1', wx + 344, wy + 29, 2);
  hline(wx + 6, rulerY, ww - 14, 2);
  for (let i = 0; i < 28; i += 1) {
    const x = wx + 18 + i * 13;
    const tall = i % 4 === 0;
    vline(x, rulerY - (tall ? 6 : 3), tall ? 6 : 3);
  }
  for (let i = 0; i < 5; i += 1) hline(wx + 18 - i, rulerY + 1 + i, i * 2 + 1);
  fill(wx + 14, rulerY + 7, 9, 2);

  // Botones de alineación.
  [0, 34, 68, 102].forEach((offset) => triangleBox(wx + 8 + offset, rulerY + 11));
  rect(wx + 150, rulerY + 13, 58, 13);
  text('Font', wx + 165, rulerY + 16);

  // Documento: líneas de palabras con cortes distintos.
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let line = 0; line < 12; line += 1) {
    const y = rulerY + 36 + line * 10;
    let x = wx + 12;
    const end = wx + ww - 26 - (line % 4 === 3 ? 90 : 0);
    while (x < end) {
      const word = 4 + Math.floor(random() * 22);
      fill(x, y, Math.min(word, end - x), 3);
      x += word + 4;
    }
  }

  // Barra de desplazamiento.
  vline(wx + ww - 16, wy + 26, wh - 29);
  checker(wx + ww - 14, wy + 42, 9, wh - 60);
  rect(wx + ww - 15, wy + 90, 11, 11);
  return bits;
}

export function initMacSaver(root) {
  if (!root) return;
  const plane = document.createElement('canvas');
  plane.setAttribute('aria-hidden', 'true');
  root.append(plane);

  function paint() {
    plane.width = WIDTH * PIXEL;
    plane.height = HEIGHT * PIXEL;
    const ctx = plane.getContext('2d');
    const bits = buildBitmap();
    ctx.fillStyle = '#35353a';
    ctx.beginPath();
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (bits[y * WIDTH + x]) ctx.rect(x * PIXEL, y * PIXEL, PIXEL - GAP, PIXEL - GAP);
      }
    }
    ctx.fill();
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let visible = false;
  let raf = 0;
  let painted = false;
  let grab = 0;
  let grabbing = null;

  function place(now) {
    const time = reduced ? 0 : now / 1000;
    const rect = root.getBoundingClientRect();
    const scroll = (rect.top + rect.height / 2) / innerHeight - 0.5;
    const panX = Math.sin(time * 0.07) * 340 + pointer.x * -120 + grab * -9;
    const panY = Math.cos(time * 0.05) * 170 + scroll * -340 + pointer.y * -70;
    const turn = 21 + pointer.x * 5 + Math.sin(time * 0.09) * 2 + grab * 0.35;
    const tilt = 44 + pointer.y * -5;
    plane.style.transform = `translate(-50%, -50%) perspective(1000px) rotateX(${tilt.toFixed(2)}deg) rotateZ(${turn.toFixed(2)}deg) translate(${panX.toFixed(1)}px, ${panY.toFixed(1)}px)`;
  }

  function loop(now) {
    raf = 0;
    if (!visible) return;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    if (grabbing === null) grab *= 0.96;
    place(now);
    raf = requestAnimationFrame(loop);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !painted) { paint(); painted = true; }
    if (visible && reduced) place(0);
    if (visible && !reduced && !raf) raf = requestAnimationFrame(loop);
  }, { rootMargin: '200px' }).observe(root);

  root.addEventListener('pointerdown', (event) => { grabbing = event.clientX; try { root.setPointerCapture(event.pointerId); } catch {} });
  root.addEventListener('pointermove', (event) => {
    if (grabbing === null) return;
    grab = Math.max(-60, Math.min(60, grab + (event.clientX - grabbing) * 0.5));
    grabbing = event.clientX;
    if (reduced) place(0);
  });
  const letGo = () => { grabbing = null; };
  root.addEventListener('pointerup', letGo);
  root.addEventListener('pointercancel', letGo);
  addEventListener('pointermove', (event) => {
    pointer.tx = event.clientX / innerWidth - 0.5;
    pointer.ty = event.clientY / innerHeight - 0.5;
  }, { passive: true });
  if (reduced) addEventListener('scroll', () => { if (visible) place(0); }, { passive: true });
}
