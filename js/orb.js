import { t } from './i18n.js';

// El orbe mira al cursor. Al abrirlo muestra datos reales de esta sesión; el medidor
// de fps solo corre con el panel abierto para no gastar frames a cambio de nada.
export function initOrb(root) {
  const rows = ['time', 'uptime', 'cursor', 'viewport', 'scroll', 'fps', 'cores', 'net', 'theme'];
  root.innerHTML = `
    <div class="orb-panel" id="orbPanel" role="region" aria-label="${t('orb_title')}" hidden>
      <div class="orb-head">● ${t('orb_title')}</div>
      <dl>${rows.map((row) => `<div><dt>${t(`orb_${row}`)}</dt><dd data-row="${row}">—</dd></div>`).join('')}</dl>
    </div>
    <button class="orb-btn" type="button" aria-expanded="false" aria-controls="orbPanel" aria-label="${t('orb_open')}">
      <span class="orb-pupil" aria-hidden="true"></span>
    </button>`;

  const button = root.querySelector('.orb-btn');
  const pupil = root.querySelector('.orb-pupil');
  const panel = root.querySelector('.orb-panel');
  const cell = Object.fromEntries(rows.map((row) => [row, root.querySelector(`[data-row="${row}"]`)]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const started = Date.now();
  const cursor = { x: null, y: null };
  let ticker = 0;
  let fpsFrame = 0;
  let frames = 0;
  let lastFps = performance.now();
  let pending = false;

  addEventListener('pointermove', (event) => {
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    if (reduced || pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const rect = button.getBoundingClientRect();
      const dx = cursor.x - (rect.left + rect.width / 2);
      const dy = cursor.y - (rect.top + rect.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(distance / 40, 1) * 12;
      pupil.style.transform = `translate(${(dx / distance) * reach}px, ${(dy / distance) * reach}px)`;
    });
  }, { passive: true });

  function countFrame(now) {
    frames += 1;
    if (now - lastFps >= 500) {
      cell.fps.textContent = String(Math.round((frames * 1000) / (now - lastFps)));
      frames = 0;
      lastFps = now;
    }
    fpsFrame = requestAnimationFrame(countFrame);
  }

  function refresh() {
    const seconds = Math.floor((Date.now() - started) / 1000);
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    cell.time.textContent = new Date().toLocaleTimeString('es', { hour12: false });
    cell.uptime.textContent = `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`;
    cell.cursor.textContent = cursor.x === null ? '—' : `${cursor.x}, ${cursor.y}`;
    cell.viewport.textContent = `${innerWidth}×${innerHeight}`;
    cell.scroll.textContent = `${scrollable > 0 ? Math.round((scrollY / scrollable) * 100) : 0}%`;
    cell.cores.textContent = String(navigator.hardwareConcurrency ?? '—');
    cell.net.textContent = navigator.onLine ? t('orb_online') : t('orb_offline');
    cell.theme.textContent = document.documentElement.dataset.theme;
  }

  function setOpen(open) {
    panel.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', t(open ? 'orb_close' : 'orb_open'));
    clearInterval(ticker);
    cancelAnimationFrame(fpsFrame);
    if (open) {
      refresh();
      ticker = setInterval(refresh, 250);
      frames = 0;
      lastFps = performance.now();
      fpsFrame = requestAnimationFrame(countFrame);
    }
  }

  button.addEventListener('click', () => setOpen(panel.hidden));
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      button.focus();
    }
  });
}
