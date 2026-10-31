// Modelos 3D en ASCII entre secciones. Giran solos, el mouse les da impulso de lado a lado,
// y al bajar cada carácter se suelta y cae hacia la siguiente sección; al subir vuelven.
import { createAtlas, createGrid, glyphIndex, render, spin } from './ascii3d.js';
import { getModel } from './models.js';

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const AUTO_SPIN = 0.32;

// Valores fijos por celda, para que la caída sea igual al subir y al bajar.
function buildFall(cols, rows, seed) {
  let state = seed;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let mix = Math.imul(state ^ (state >>> 15), 1 | state);
    mix = (mix + Math.imul(mix ^ (mix >>> 7), 61 | mix)) ^ mix;
    return ((mix ^ (mix >>> 14)) >>> 0) / 4294967296;
  };
  const count = cols * rows;
  const fall = { delay: new Float32Array(count), speed: new Float32Array(count), drift: new Float32Array(count), phase: new Float32Array(count) };
  for (let index = 0; index < count; index += 1) {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const distance = Math.min(1, Math.hypot(col / cols - 0.5, row / rows - 0.5) * 2);
    // Lo de afuera se suelta primero.
    fall.delay[index] = random() * 0.28 + (1 - distance) * 0.4;
    fall.speed[index] = 0.75 + random() * 0.6;
    fall.drift[index] = (random() - 0.5) * 90;
    fall.phase[index] = random() * 6.28;
  }
  return fall;
}

export function drawModel(ctx, atlas, grid, originX, originY) {
  const { cols, rows, light } = grid;
  const { canvas, slot, height, cellW, cellH } = atlas;
  for (let index = 0; index < light.length; index += 1) {
    const shade = light[index];
    if (shade < 0) continue;
    ctx.drawImage(canvas, glyphIndex(shade) * slot, 0, slot, height, originX + (index % cols) * cellW, originY + Math.floor(index / cols) * cellH, cellW + 0.4, cellH);
  }
  return rows;
}

export function initFlowers(canvas) {
  const ctx = canvas.getContext('2d');
  const seps = [...document.querySelectorAll('.flower-sep')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let items = [];
  let atlas = null;
  let ratio = 1;
  let frame = 0;
  let last = 0;
  let quality = 1;
  let cost = 0;
  let lastAdapt = 0;

  const fgColor = () => getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();

  function layout() {
    // Esta capa cubre toda la ventana: a 2x eran 4 millones de píxeles por cuadro.
    ratio = Math.min(devicePixelRatio || 1, 1.5) * quality;
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    const narrow = innerWidth < 720;
    atlas = createAtlas(7, ratio, fgColor());
    items = seps.map((sep, index) => {
      const box = sep.getBoundingClientRect();
      const height = box.height;
      const width = Math.min(innerWidth * (narrow ? 1 : 0.62), height * 1.15);
      const cols = Math.ceil(width / atlas.cellW);
      const rows = Math.ceil(height / atlas.cellH);
      const side = sep.dataset.side === 'right' ? 0.73 : 0.27;
      return {
        sep,
        docTop: box.top + scrollY,
        name: sep.dataset.flower,
        width,
        height,
        scale: Math.min(width, height) * 0.46,
        centerX: narrow ? innerWidth / 2 : innerWidth * side,
        cols,
        rows,
        yaw: items[index]?.yaw ?? index * 1.3 - 0.5,
        velocity: items[index]?.velocity ?? 0,
        dragging: false,
        grid: null,
        fall: null,
        seed: 101 + index * 37,
      };
    });
  }

  function draw(dt) {
    const height = innerHeight;
    const width = innerWidth;
    const scrollTop = scrollY;
    let anyVisible = false;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const { canvas: glyphs, slot, height: glyphH, cellW, cellH } = atlas;
    for (const item of items) {
      // Con la posición guardada no se fuerza a recalcular el layout en cada cuadro.
      const top = item.docTop - scrollTop;
      const centerY = top + item.height / 2;
      const progress = reduced ? 0 : clamp01((height * 0.5 - centerY) / (height * 0.9));
      if (progress === 1) continue;
      if (progress === 0 && (top > height || top + item.height < 0)) continue;
      anyVisible = true;
      const model = getModel(item.name);
      if (!model) continue;
      // Cada grilla se crea al acercarse: hacer las seis al cargar trababa la página.
      item.grid ??= createGrid(item.cols, item.rows);
      item.fall ??= buildFall(item.cols, item.rows, item.seed);
      if (!reduced) {
        const aim = item.sep.__aim;
        if (aim !== undefined) {
          // Modo portal: la pistola apunta al cursor en vez de girar sola.
          item.yaw += (aim - item.yaw) * Math.min(1, dt * 9);
          item.roll = (item.roll ?? 0) + ((item.sep.__roll ?? 0) - (item.roll ?? 0)) * Math.min(1, dt * 9);
        } else {
          item.yaw += ((item.dragging ? 0 : AUTO_SPIN) + spin.velocity + item.velocity) * dt;
          item.velocity *= Math.exp(-dt * 1.9);
          item.roll = 0;
        }
      }
      const pitch = model.pitch + (reduced || item.sep.__aim !== undefined ? 0 : (spin.pointerY - 0.5) * 0.34);
      render(model.mesh, item.grid, item.yaw, pitch, cellW, cellH, item.scale, item.roll ?? 0);
      const { light } = item.grid;
      const { delay, speed, drift, phase } = item.fall;
      let lastFade = 1;
      ctx.globalAlpha = 1;
      const originX = item.centerX - (item.cols * cellW) / 2;
      const originY = centerY - (item.rows * cellH) / 2;
      for (let index = 0; index < light.length; index += 1) {
        const shade = light[index];
        if (shade < 0) continue;
        const time = clamp01((progress - delay[index]) / (1 - delay[index]));
        const fade = 1 - time * time;
        if (fade < 0.04) continue;
        const y = originY + Math.floor(index / item.cols) * cellH + time * time * height * 2.1 * speed[index];
        if (y < -12 || y > height) continue;
        const x = originX + (index % item.cols) * cellW + time * (drift[index] + Math.sin(time * 7 + phase[index]) * 16);
        if (x < -12 || x > width) continue;
        if (fade !== lastFade) { ctx.globalAlpha = fade; lastFade = fade; }
        ctx.drawImage(glyphs, glyphIndex(shade) * slot, 0, slot, glyphH, x, y, cellW + 0.4, cellH);
      }
    }
    ctx.globalAlpha = 1;
    return anyVisible;
  }

  function loop(now) {
    frame = 0;
    if (!reduced && now - last < 32) { schedule(); return; }
    const dt = Math.min(0.1, (now - last) / 1000) || 0;
    last = now;
    spin.tick(dt);
    const started = performance.now();
    const anyVisible = draw(dt);
    // En equipos lentos baja la resolución de esta capa en vez de trabar toda la página.
    cost = cost * 0.9 + (performance.now() - started) * 0.1;
    if (cost > 14 && quality > 0.7 && now - lastAdapt > 2000) {
      quality = 0.7;
      lastAdapt = now;
      cost = 0;
      layout();
    }
    if (anyVisible && !reduced) schedule();
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(loop);
  }
  const rebuild = () => { layout(); schedule(); };

  spin.attach();
  addEventListener('scroll', schedule, { passive: true });

  // Con el dedo (o el mouse) cada modelo se gira arrastrándolo de lado. Los separadores están
  // encima del lienzo, así que reciben el toque; con touch-action: pan-y el scroll vertical sigue libre.
  for (const sep of seps) {
    let drag = null;
    const itemOf = () => items.find((entry) => entry.sep === sep);
    const inside = (item, x) => Math.abs(x - item.centerX) <= item.width / 2;
    sep.addEventListener('pointerdown', (event) => {
      const item = itemOf();
      if (!item || !inside(item, event.clientX)) return;
      drag = { item, x: event.clientX };
      item.dragging = true;
      item.velocity = 0;
      try { sep.setPointerCapture(event.pointerId); } catch {}
      sep.style.cursor = 'grabbing';
    });
    sep.addEventListener('pointermove', (event) => {
      if (!drag) {
        const item = itemOf();
        sep.style.cursor = item && event.pointerType === 'mouse' && inside(item, event.clientX) ? 'grab' : '';
        return;
      }
      const delta = event.clientX - drag.x;
      drag.x = event.clientX;
      drag.item.yaw += delta * 0.012;
      drag.item.velocity = delta * 0.25;
      schedule();
    });
    const release = () => {
      if (!drag) return;
      drag.item.dragging = false;
      drag = null;
      sep.style.cursor = '';
      schedule();
    };
    sep.addEventListener('pointerup', release);
    sep.addEventListener('pointercancel', release);
  }
  // En móvil la barra del navegador cambia solo el alto al hacer scroll: regenerar ahí daría tirones.
  let lastWidth = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth !== lastWidth) { lastWidth = innerWidth; rebuild(); return; }
    canvas.height = Math.round(innerHeight * ratio);
    schedule();
  });
  // Abrir una entrada del blog mueve los modelos de abajo.
  new ResizeObserver(() => {
    for (const item of items) item.docTop = item.sep.getBoundingClientRect().top + scrollY;
    schedule();
  }).observe(document.body);
  document.addEventListener('site:theme', rebuild);
  document.fonts?.ready.then(rebuild);
  rebuild();
}

// Un modelo dentro de una entrada del blog: gira solo y se arrastra con el dedo o el mouse.
export function mountModel(canvas, name) {
  const model = getModel(name);
  if (!model) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let atlas = null;
  let grid = null;
  let ratio = 1;
  let cssW = 0;
  let cssH = 0;
  let yaw = 0.5;
  let velocity = 0;
  let visible = false;
  let raf = 0;
  let last = 0;
  let dragX = null;

  function layout() {
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    if (!cssW || !cssH) return;
    canvas.width = Math.round(cssW * ratio);
    canvas.height = Math.round(cssH * ratio);
    atlas = createAtlas(7, ratio, getComputedStyle(document.documentElement).getPropertyValue('--fg').trim());
    grid = createGrid(Math.ceil(cssW / atlas.cellW), Math.ceil(cssH / atlas.cellH));
  }

  function paint() {
    if (!grid) return;
    render(model.mesh, grid, yaw, model.pitch, atlas.cellW, atlas.cellH, Math.min(cssW, cssH) * 0.47);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    drawModel(ctx, atlas, grid, (cssW - grid.cols * atlas.cellW) / 2, (cssH - grid.rows * atlas.cellH) / 2);
  }

  function loop(now) {
    raf = 0;
    if (!visible) return;
    raf = requestAnimationFrame(loop);
    if (now - last < 32) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    velocity *= Math.exp(-dt * 1.9);
    if (dragX === null) yaw += (AUTO_SPIN + velocity + spin.velocity) * dt;
    paint();
  }

  new ResizeObserver(() => { layout(); paint(); }).observe(canvas);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !reduced && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); }
    if (visible && reduced) paint();
  }).observe(canvas);

  canvas.addEventListener('pointerdown', (event) => {
    dragX = event.clientX;
    try { canvas.setPointerCapture(event.pointerId); } catch {}
  });
  canvas.addEventListener('pointermove', (event) => {
    if (dragX === null) return;
    const delta = event.clientX - dragX;
    dragX = event.clientX;
    yaw += delta * 0.012;
    velocity = delta * 0.25;
    if (reduced) paint();
  });
  const release = () => { dragX = null; };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  document.addEventListener('site:theme', () => { layout(); paint(); });
}

// Las secciones entran con un corrimiento corto, en cascada. Se ata al scroll solo la primera vez.
export function initReveal() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const selector = '.sec-head, .prose p, .sub-h, .chips li, .contact-list li';
  const nodes = [...document.querySelectorAll(selector)].filter((node) => node.getBoundingClientRect().top > innerHeight * 0.7);
  document.documentElement.classList.add('reveal');
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
      // Sin esto, la transición larga le ganaría a los hover de las tarjetas.
      setTimeout(() => entry.target.classList.remove('rv', 'in'), 1100);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  for (const node of nodes) {
    const index = [...node.parentElement.children].indexOf(node);
    node.style.setProperty('--i', String(Math.min(index, 8)));
    node.classList.add('rv');
    observer.observe(node);
  }
}
