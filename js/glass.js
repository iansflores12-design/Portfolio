// Paneles de vidrio acanalado con luz en movimiento. La escena se pinta en un shader y
// cada costilla del vidrio la desplaza. Solo corren mientras están en pantalla, y sin
// WebGL queda el degradado de .glass en el CSS.
const VERTEX = `attribute vec2 a; void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAGMENT = `
precision mediump float;
uniform vec2 uRes;
uniform vec2 uPointer;
uniform float uTime, uScroll, uSeed, uRib, uFlower, uDark;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

vec3 wave(vec2 p) {
  float aspect = uRes.x / uRes.y;
  float t = uTime * 0.18 + uSeed;
  float curve = 0.36 + 0.42 * p.x + 0.07 * sin(p.x * 5.0 + t * 1.6)
    + (uPointer.y - 0.5) * 0.12 - uScroll * 0.28;
  float d = p.y - curve;
  float sky = mix(0.66, 0.3, smoothstep(0.0, 0.7, d)) + 0.1 * sin(p.x * 9.0 + t);
  float band = exp(-d * d * (d > 0.0 ? 70.0 : 900.0));
  float above = smoothstep(-0.05, 0.03, d);
  vec2 center = vec2(0.34 + 0.16 * sin(t * 0.7) + (uPointer.x - 0.5) * 0.12, 0.16);
  float disc = smoothstep(0.42, 0.34, length((p - center) * vec2(aspect, 1.0) / max(1.0, aspect * 0.45)));
  return vec3((sky * above + band * 0.95 * above) * (1.0 - disc));
}

vec3 flower(vec2 p) {
  float aspect = uRes.x / uRes.y;
  float t = uTime * 0.3 + uSeed;
  vec2 q = (p - vec2(0.5, 0.58)) * vec2(aspect, 1.0) / min(1.0, aspect);
  float radius = length(q) / 0.36;
  float angle = atan(q.y, q.x) + 0.07 * sin(t);
  float lobes = 0.74 + 0.26 * abs(cos(angle * 4.5));
  vec3 color = mix(vec3(0.78), vec3(0.03), uDark) + 0.05 * p.y;
  float stem = smoothstep(0.022, 0.012, abs(q.x + 0.015 * sin(q.y * 4.0))) * step(q.y, 0.0);
  color = mix(color, vec3(0.13, 0.17, 0.07), stem);
  float m = radius / lobes;
  vec3 petals = mix(vec3(0.09, 0.04, 0.3), vec3(0.74, 0.54, 0.95), smoothstep(0.22, 1.0, m));
  petals += 0.07 * sin(angle * 34.0) * m;
  vec2 lightAt = vec2(0.5 * sin(t * 0.8) + (uPointer.x - 0.5) * 0.5, 0.45 * cos(t * 0.6) - (uPointer.y - 0.5) * 0.5);
  petals *= 0.72 + 0.75 * exp(-dot(q / 0.36 - lightAt, q / 0.36 - lightAt) * 1.4);
  color = mix(color, petals, smoothstep(1.02, 0.97, m));
  color = mix(color, vec3(0.1, 0.08, 0.14), smoothstep(0.25, 0.2, radius));
  return color;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float ribs = max(8.0, floor(uRes.x / uRib));
  float x = uv.x * ribs;
  float rib = floor(x);
  float f = fract(x) - 0.5;
  // Cada costilla comprime lo de atrás y lo inclina: de ahí los cortes en diente de sierra.
  vec2 p = vec2((rib + 0.5 + f * 2.3) / ribs, uv.y + f * abs(f) * 0.3 + 0.02 * sin(rib * 1.7));
  vec3 color = uFlower > 0.5 ? flower(p) : wave(p);
  float sweep = fract(uTime * 0.05 + uSeed) * 1.6 - 0.3;
  float across = (uv.x - sweep) * 5.0;
  color += 0.2 * exp(-across * across) * (1.0 - abs(f) * 2.0);
  color *= 1.0 - 0.55 * smoothstep(0.4, 0.5, abs(f));
  color += 0.16 * smoothstep(0.45, 0.49, -f) * (color.r + 0.25);
  color += (hash(gl_FragCoord.xy) - 0.5) * 0.03;
  gl_FragColor = vec4(color, 1.0);
}`;

function program(gl) {
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const linked = gl.createProgram();
  gl.attachShader(linked, compile(gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(linked, compile(gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(linked);
  return gl.getProgramParameter(linked, gl.LINK_STATUS) ? linked : null;
}

export function initGlass() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
  const panels = [];
  const isDark = () => (document.documentElement.dataset.theme === 'dark' ? 1 : 0);

  const setup = (canvas, index) => {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    const linked = gl && program(gl);
    if (!linked) return;
    canvas.classList.add('is-live');
    gl.useProgram(linked);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(linked, 'a');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniform = Object.fromEntries(['uRes', 'uPointer', 'uTime', 'uScroll', 'uSeed', 'uRib', 'uFlower', 'uDark'].map((name) => [name, gl.getUniformLocation(linked, name)]));
    const panel = { canvas, gl, uniform, seed: index * 2.7, visible: false, flower: canvas.dataset.scene === 'flower' ? 1 : 0, ratio: 1 };
    panels.push(panel);

    new ResizeObserver(() => {
      // Es un degradado suave: a 1x se ve igual y el shader corre sobre mucho menos píxeles.
      panel.ratio = 1;
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * panel.ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * panel.ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      paint(panel, performance.now());
    }).observe(canvas);
    observer.observe(canvas);
  };

  // Compilar los shaders al cargar bloqueaba casi medio segundo en móvil: cada panel se
  // prepara cuando está por entrar en pantalla.
  const canvases = [...document.querySelectorAll('canvas.glass')];
  const lazy = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      lazy.unobserve(entry.target);
      setup(entry.target, canvases.indexOf(entry.target));
    }
  }, { rootMargin: '300px' });
  canvases.forEach((canvas) => lazy.observe(canvas));

  function paint(panel, now) {
    const { gl, uniform, canvas } = panel;
    const rect = canvas.getBoundingClientRect();
    gl.uniform2f(uniform.uRes, canvas.width, canvas.height);
    gl.uniform2f(uniform.uPointer, pointer.x, pointer.y);
    gl.uniform1f(uniform.uTime, reduced ? 12 : now / 1000);
    gl.uniform1f(uniform.uScroll, (rect.top + rect.height / 2) / innerHeight - 0.5);
    gl.uniform1f(uniform.uSeed, panel.seed);
    gl.uniform1f(uniform.uRib, (panel.flower ? 26 : 28) * panel.ratio);
    gl.uniform1f(uniform.uFlower, panel.flower);
    gl.uniform1f(uniform.uDark, isDark());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const panel = panels.find((item) => item.canvas === entry.target);
      panel.visible = entry.isIntersecting;
      if (entry.isIntersecting) paint(panel, performance.now());
    }
    if (!reduced) start();
  }, { rootMargin: '60px' });

  document.addEventListener('site:theme', () => panels.forEach((panel) => paint(panel, performance.now())));

  // Con movimiento reducido queda un cuadro fijo y no se escucha nada más.
  if (reduced) return;

  addEventListener('pointermove', (event) => {
    pointer.targetX = event.clientX / innerWidth;
    pointer.targetY = event.clientY / innerHeight;
  }, { passive: true });

  let running = false;
  let last = 0;
  function loop(now) {
    if (!panels.some((panel) => panel.visible)) { running = false; return; }
    requestAnimationFrame(loop);
    // A 30 fps se ve igual de fluido y gasta la mitad de batería.
    if (now - last < 32) return;
    last = now;
    pointer.x += (pointer.targetX - pointer.x) * 0.06;
    pointer.y += (pointer.targetY - pointer.y) * 0.06;
    panels.forEach((panel) => { if (panel.visible) paint(panel, now); });
  }
  function start() {
    if (running || !panels.some((panel) => panel.visible)) return;
    running = true;
    requestAnimationFrame(loop);
  }
}
