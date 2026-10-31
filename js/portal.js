// Modo portal: tocar la pistola la activa; apunta al cursor y cada clic dispara un portal
// (azul, naranja, azul…). Si el cursor entra en uno, aparece saliendo por el otro.
const COLORS = ['blue', 'orange'];
// Lo que se puede agarrar en modo portal: el elemento más pequeño bajo el cursor.
const GRAB = 'h1,h2,h3,h4,p,li,a,button,img,figure,dt,dd,pre,label,article,summary,.rec';

export function initPortals(gun) {
  if (!gun) return;
  const portals = {};
  const layer = document.createElement('canvas');
  layer.className = 'portal-layer';
  layer.setAttribute('aria-hidden', 'true');
  const ctx = layer.getContext('2d');
  const tint = { blue: '#3aa0ff', orange: '#ff8a2a' };
  const GLYPHS = '@#%&01<>/{}*+=:;';
  let particles = [];
  let raf = 0;
  let lastTime = 0;
  const fit = () => {
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    layer.width = Math.round(innerWidth * ratio);
    layer.height = Math.round(innerHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  fit();
  addEventListener('resize', fit);

  // Los portales son anillos de texto; de ellos caen partículas de texto, como el sistema de caracteres de la página.
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - lastTime) / 1000) || 0.016;
    lastTime = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const step = Math.floor(now / 90);
    for (const key of Object.keys(portals)) {
      const portal = portals[key];
      const cy = portal.y - scrollY;
      const grow = Math.min(1, (now - portal.born) / 260);
      ctx.fillStyle = tint[key];
      ctx.globalAlpha = 1;
      for (let ring = 0; ring < 2; ring += 1) {
        const count = ring ? 26 : 40;
        const scale = grow * (ring ? 0.8 : 1);
        for (let i = 0; i < count; i += 1) {
          const angle = (i / count) * Math.PI * 2 + (ring ? -now : now) / 1400;
          const char = GLYPHS[(i * 7 + step * (ring + 1) + ring * 3) % GLYPHS.length];
          ctx.globalAlpha = ring ? 0.55 : 1;
          ctx.fillText(char, portal.x + Math.cos(angle) * 34 * scale, cy + Math.sin(angle) * 68 * scale);
        }
      }
      ctx.globalAlpha = 0.18;
      for (let row = -3; row <= 3; row += 1) ctx.fillText('· · ·', portal.x, cy + row * 16 * grow);
      if (Math.random() < dt * 40) {
        const angle = Math.random() * Math.PI * 2;
        particles.push({
          x: portal.x + Math.cos(angle) * 34, y: cy + Math.sin(angle) * 68, vx: (Math.random() - 0.5) * 30, vy: Math.random() * 20,
          char: GLYPHS[Math.floor(Math.random() * GLYPHS.length)], life: 0, max: 0.9 + Math.random() * 0.8, color: tint[key], scrollAt: scrollY,
        });
      }
    }
    for (const part of particles) {
      part.life += dt;
      part.vy += 260 * dt;
      part.x += part.vx * dt;
      part.y += part.vy * dt;
      ctx.globalAlpha = Math.max(0, 1 - part.life / part.max);
      ctx.fillStyle = part.color;
      ctx.fillText(part.char, part.x, part.y + (part.scrollAt - scrollY));
    }
    ctx.globalAlpha = 1;
    particles = particles.filter((part) => part.life < part.max);
    if (Object.keys(portals).length || particles.length) raf = requestAnimationFrame(frame);
  }
  const wake = () => { if (!raf) { lastTime = performance.now(); raf = requestAnimationFrame(frame); } };
  const hint = document.createElement('div');
  hint.className = 'portal-hint';
  hint.hidden = true;
  hint.textContent = 'modo portal · clic dispara · Esc sale';
  const ghost = document.createElement('div');
  ghost.className = 'portal-ghost';
  ghost.hidden = true;
  document.body.append(layer, hint, ghost);

  let on = false;
  let shots = 0;
  const pointer = { x: 0, y: 0 };

  const muzzle = () => {
    const box = gun.getBoundingClientRect();
    return { x: innerWidth < 720 ? innerWidth / 2 : innerWidth * (gun.dataset.side === 'right' ? 0.73 : 0.27), y: box.top + box.height / 2 };
  };

  // La boca de la pistola mira hacia -x del modelo: con yaw 0 apunta a la izquierda y con π a la
  // derecha; el roll la inclina para que también apunte arriba o abajo.
  function aim() {
    const origin = muzzle();
    const dx = pointer.x - origin.x;
    const up = origin.y - pointer.y;
    const right = dx > 0;
    gun.__aim = right ? Math.PI : 0;
    gun.__roll = right ? Math.atan2(up, dx) : Math.atan2(up, -dx) * -1;
  }

  function setOn(value) {
    on = value;
    hint.hidden = !on;
    document.documentElement.classList.toggle('portal-mode', on);
    if (!on) {
      gun.__aim = undefined;
      gun.__roll = 0;
      ghost.hidden = true;
      for (const key of Object.keys(portals)) delete portals[key];
      // Todo vuelve a su lugar al salir del modo portal.
      for (const el of moved) {
        el.style.transition = 'transform 0.45s ease';
        el.style.transform = '';
        el.__pos = undefined;
        setTimeout(() => { el.style.transition = ''; el.classList.remove('portal-moved'); }, 500);
      }
      moved.clear();
      held = null;
      shots = 0;
    } else aim();
  }

  function shoot(x, y) {
    const color = COLORS[shots % 2];
    shots += 1;
    const origin = muzzle();
    const bolt = document.createElement('div');
    bolt.className = `portal-bolt ${color}`;
    bolt.textContent = '@';
    bolt.style.left = `${origin.x}px`;
    bolt.style.top = `${origin.y}px`;
    document.body.append(bolt);
    const fly = bolt.animate(
      [{ transform: 'translate(-50%, -50%)' }, { transform: `translate(calc(${x - origin.x}px - 50%), calc(${y - origin.y}px - 50%))` }],
      { duration: 160, easing: 'ease-in' },
    );
    // setTimeout y no solo onfinish: en pestañas en segundo plano la animación no termina.
    let landed = false;
    const land = () => {
      if (landed) return;
      landed = true;
      bolt.remove();
      portals[color] = { x, y: y + scrollY, born: performance.now() };
      wake();
      updateGhost();
    };
    fly.onfinish = land;
    setTimeout(land, 260);
  }

  // Dentro de un portal (con margen) el cursor "sale" por el otro, con el mismo desplazamiento.
  function updateGhost() {
    const pair = portals.blue && portals.orange;
    if (!on || !pair) { ghost.hidden = true; return; }
    const px = pointer.x;
    const py = pointer.y + scrollY;
    for (const [from, to] of [['blue', 'orange'], ['orange', 'blue']]) {
      const a = portals[from];
      const nx = (px - a.x) / 34;
      const ny = (py - a.y) / 68;
      if (nx * nx + ny * ny <= 1) {
        const b = portals[to];
        ghost.style.left = `${b.x + (px - a.x)}px`;
        ghost.style.top = `${b.y + (py - a.y) - scrollY}px`;
        ghost.className = `portal-ghost ${to}`;
        ghost.hidden = false;
        return;
      }
    }
    ghost.hidden = true;
  }

  // Arrastrar: el elemento sigue al cursor con un transform (el layout no cambia). Si el cursor
  // entra en un portal, el elemento sigue saliendo por el otro, igual que el cursor fantasma.
  const moved = new Set();
  let held = null;
  let suppressClick = false;

  function enteredPortal() {
    if (!portals.blue || !portals.orange) return null;
    const px = pointer.x;
    const py = pointer.y + scrollY;
    for (const [from, to] of [['blue', 'orange'], ['orange', 'blue']]) {
      const a = portals[from];
      const nx = (px - a.x) / 34;
      const ny = (py - a.y) / 68;
      if (nx * nx + ny * ny <= 1) return { from: a, to: portals[to] };
    }
    return null;
  }

  function placeHeld() {
    const { el, startX, startY, base, shift } = held;
    const x = base.x + pointer.x - startX + shift.x;
    const y = base.y + pointer.y - startY + shift.y;
    el.__pos = { x, y };
    el.style.transform = `translate(${x}px, ${y}px)`;
  }

  document.addEventListener('pointerdown', (event) => {
    if (!on || event.button > 0) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || gun.contains(target) || target.closest('.portal-hint, .flower-sep')) return;
    const el = target.closest(GRAB);
    if (!el) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    held = { el, startX: event.clientX, startY: event.clientY, base: el.__pos ?? { x: 0, y: 0 }, shift: { x: 0, y: 0 }, inside: false, moved: false };
    event.preventDefault();
  }, true);

  function dragStep() {
    if (!held) return;
    if (!held.moved && Math.hypot(pointer.x - held.startX, pointer.y - held.startY) < 6) return;
    if (!held.moved) {
      held.moved = true;
      held.el.classList.add('portal-held', 'portal-moved');
      moved.add(held.el);
    }
    const hit = enteredPortal();
    if (hit && !held.inside) {
      held.inside = true;
      const jump = { x: hit.to.x - hit.from.x, y: hit.to.y - hit.from.y };
      held.shift = held.shift.x || held.shift.y ? { x: 0, y: 0 } : jump;
    } else if (!hit) held.inside = false;
    placeHeld();
  }

  function drop() {
    if (!held) return;
    held.el.classList.remove('portal-held');
    if (held.moved) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 120); }
    held = null;
  }
  addEventListener('pointerup', drop);
  addEventListener('pointercancel', drop);

  let down = null;
  gun.addEventListener('pointerdown', (event) => { down = { x: event.clientX, y: event.clientY }; });
  gun.addEventListener('pointerup', (event) => {
    if (!down) return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    const box = gun.getBoundingClientRect();
    const near = event.clientY >= box.top && event.clientY <= box.bottom && Math.abs(event.clientX - (innerWidth < 720 ? innerWidth / 2 : innerWidth * (gun.dataset.side === 'right' ? 0.73 : 0.27))) < Math.min(innerWidth * 0.3, 220);
    if (moved < 6 && near) { pointer.x = event.clientX; pointer.y = event.clientY; setOn(!on); }
  });

  addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!on) return;
    aim();
    updateGhost();
    dragStep();
  }, { passive: true });
  addEventListener('scroll', () => { if (on) { aim(); updateGhost(); } }, { passive: true });

  // En modo portal el clic dispara en vez de abrir enlaces o botones; la pistola lo apaga.
  document.addEventListener('click', (event) => {
    if (!on) return;
    if (gun.contains(event.target)) return;
    event.preventDefault();
    if (suppressClick) { suppressClick = false; event.stopPropagation(); return; }
    event.stopPropagation();
    shoot(event.clientX, event.clientY);
  }, true);
  addEventListener('keydown', (event) => { if (event.key === 'Escape' && on) setOn(false); });
}
