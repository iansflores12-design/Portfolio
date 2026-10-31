// Mini motor 3D que pinta caracteres en vez de píxeles: triángulos reales con profundidad
// y luz, y cada celda de la grilla elige su carácter según lo iluminada que quedó.
export const RAMP = '.,:;-~=+*xo%#&@';

export class Mesh {
  constructor() { this.verts = []; this.tris = []; }

  vert(x, y, z) { this.verts.push(x, y, z); return this.verts.length / 3 - 1; }
  tri(a, b, c, tone) { this.tris.push(a, b, c, tone); }
  quad(a, b, c, d, tone) { this.tri(a, b, c, tone); this.tri(a, c, d, tone); }

  box(cx, cy, cz, sx, sy, sz, tone) {
    const [hx, hy, hz] = [sx / 2, sy / 2, sz / 2];
    const p = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]
      .map(([x, y, z]) => this.vert(cx + x * hx, cy + y * hy, cz + z * hz));
    for (const [a, b, c, d] of [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]]) {
      this.quad(p[a], p[b], p[c], p[d], tone);
    }
    return this;
  }

  // Cilindro o cono entre dos puntos, en cualquier dirección.
  tube(a, b, r1, r2, seg, tone) {
    const axis = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const length = Math.hypot(...axis) || 1;
    const w = axis.map((n) => n / length);
    const helper = Math.abs(w[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
    const u = [w[1] * helper[2] - w[2] * helper[1], w[2] * helper[0] - w[0] * helper[2], w[0] * helper[1] - w[1] * helper[0]];
    const ul = Math.hypot(...u);
    u[0] /= ul; u[1] /= ul; u[2] /= ul;
    const v = [w[1] * u[2] - w[2] * u[1], w[2] * u[0] - w[0] * u[2], w[0] * u[1] - w[1] * u[0]];
    const ring = (center, radius) => Array.from({ length: seg }, (_, i) => {
      const angle = (i / seg) * Math.PI * 2;
      const [c, s] = [Math.cos(angle) * radius, Math.sin(angle) * radius];
      return this.vert(center[0] + u[0] * c + v[0] * s, center[1] + u[1] * c + v[1] * s, center[2] + u[2] * c + v[2] * s);
    });
    const [ra, rb] = [ring(a, r1), ring(b, r2)];
    const [ca, cb] = [this.vert(...a), this.vert(...b)];
    for (let i = 0; i < seg; i += 1) {
      const j = (i + 1) % seg;
      this.quad(ra[i], ra[j], rb[j], rb[i], tone);
      this.tri(ca, ra[j], ra[i], tone);
      this.tri(cb, rb[i], rb[j], tone);
    }
    return this;
  }

  sphere(c, r, seg, tone) {
    const index = (i, j) => i * (seg * 2) + (j % (seg * 2));
    const base = this.verts.length / 3;
    for (let i = 0; i < seg + 1; i += 1) {
      const phi = (i / seg) * Math.PI;
      for (let j = 0; j < seg * 2; j += 1) {
        const theta = (j / (seg * 2)) * Math.PI * 2;
        this.vert(c[0] + r * Math.sin(phi) * Math.cos(theta), c[1] + r * Math.cos(phi), c[2] + r * Math.sin(phi) * Math.sin(theta));
      }
    }
    for (let i = 0; i < seg; i += 1) {
      for (let j = 0; j < seg * 2; j += 1) {
        this.quad(base + index(i, j), base + index(i, j + 1), base + index(i + 1, j + 1), base + index(i + 1, j), tone);
      }
    }
    return this;
  }

  // Superficie paramétrica: fn(u, v) devuelve [x, y, z, tono], con u y v entre 0 y 1.
  surface(fn, nu, nv) {
    const base = this.verts.length / 3;
    const tones = [];
    for (let i = 0; i <= nu; i += 1) {
      for (let j = 0; j <= nv; j += 1) {
        const [x, y, z, tone] = fn(i / nu, j / nv);
        this.vert(x, y, z);
        tones.push(tone);
      }
    }
    const at = (i, j) => i * (nv + 1) + j;
    for (let i = 0; i < nu; i += 1) {
      for (let j = 0; j < nv; j += 1) {
        const tone = (tones[at(i, j)] + tones[at(i + 1, j + 1)]) / 2;
        this.quad(base + at(i, j), base + at(i + 1, j), base + at(i + 1, j + 1), base + at(i, j + 1), tone);
      }
    }
    return this;
  }

  // Centra el modelo y lo deja en radio 1, para que girar nunca lo saque de su zona.
  finish() {
    const v = this.verts;
    const low = [Infinity, Infinity, Infinity];
    const high = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < v.length; i += 3) {
      for (let k = 0; k < 3; k += 1) {
        low[k] = Math.min(low[k], v[i + k]);
        high[k] = Math.max(high[k], v[i + k]);
      }
    }
    const center = low.map((n, k) => (n + high[k]) / 2);
    let radius = 0;
    for (let i = 0; i < v.length; i += 3) {
      for (let k = 0; k < 3; k += 1) v[i + k] -= center[k];
      radius = Math.max(radius, Math.hypot(v[i], v[i + 1], v[i + 2]));
    }
    for (let i = 0; i < v.length; i += 1) v[i] /= radius;
    this.positions = new Float32Array(v);
    this.tones = new Float32Array(this.tris.length / 4);
    this.indices = new Uint32Array((this.tris.length / 4) * 3);
    for (let i = 0; i < this.tris.length / 4; i += 1) {
      this.indices[i * 3] = this.tris[i * 4];
      this.indices[i * 3 + 1] = this.tris[i * 4 + 1];
      this.indices[i * 3 + 2] = this.tris[i * 4 + 2];
      this.tones[i] = this.tris[i * 4 + 3];
    }
    this.rotated = new Float32Array(this.positions.length);
    this.tris = this.verts = null;
    return this;
  }
}

const LIGHT = (() => {
  const [x, y, z] = [-0.5, 0.62, 0.6];
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
})();
const HALF = (() => {
  const [x, y, z] = [LIGHT[0], LIGHT[1], LIGHT[2] + 1];
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length];
})();
const CAMERA = 3.6;

export function createGrid(cols, rows) {
  return { cols, rows, light: new Float32Array(cols * rows), depth: new Float32Array(cols * rows) };
}

// `tone` mayor que 1 es material que emite su propia luz (la pantalla del Mac, el núcleo
// de la pistola): vale tone - 1 sin importar cómo le dé la lámpara.
export function render(mesh, grid, yaw, pitch, cellW, cellH, scale, roll = 0) {
  const { cols, rows, light, depth } = grid;
  light.fill(-1);
  depth.fill(-Infinity);
  const [cy, sy, cp, sp] = [Math.cos(yaw), Math.sin(yaw), Math.cos(pitch), Math.sin(pitch)];
  const [cr, sr] = [Math.cos(roll), Math.sin(roll)];
  const { positions, rotated, indices, tones } = mesh;
  for (let i = 0; i < positions.length; i += 3) {
    const [x, y, z] = [positions[i], positions[i + 1], positions[i + 2]];
    const rx = x * cy + z * sy;
    const rz = -x * sy + z * cy;
    const ry = y * cp - rz * sp;
    rotated[i] = rx * cr - ry * sr;
    rotated[i + 1] = rx * sr + ry * cr;
    rotated[i + 2] = y * sp + rz * cp;
  }
  const midX = cols / 2;
  const midY = rows / 2;
  const px = scale / cellW;
  const py = scale / cellH;
  for (let t = 0; t < tones.length; t += 1) {
    const a = indices[t * 3] * 3;
    const b = indices[t * 3 + 1] * 3;
    const c = indices[t * 3 + 2] * 3;
    const [ax, ay, az] = [rotated[a], rotated[a + 1], rotated[a + 2]];
    const [bx, by, bz] = [rotated[b], rotated[b + 1], rotated[b + 2]];
    const [cx, cyy, cz] = [rotated[c], rotated[c + 1], rotated[c + 2]];
    const [e1x, e1y, e1z, e2x, e2y, e2z] = [bx - ax, by - ay, bz - az, cx - ax, cyy - ay, cz - az];
    let nx = e1y * e2z - e1z * e2y;
    let ny = e1z * e2x - e1x * e2z;
    let nz = e1x * e2y - e1y * e2x;
    const length = Math.hypot(nx, ny, nz) || 1;
    nx /= length; ny /= length; nz /= length;
    // Las dos caras se iluminan: los pétalos no son volúmenes cerrados.
    if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const tone = tones[t];
    let shade;
    if (tone > 1) {
      shade = tone - 1;
    } else {
      const diffuse = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const shine = Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]) ** 28;
      shade = Math.min(1, (tone * (0.24 + 0.76 * diffuse) + shine * 0.42 * tone) ** 0.82);
    }
    const pa = CAMERA / (CAMERA - az);
    const pb = CAMERA / (CAMERA - bz);
    const pc = CAMERA / (CAMERA - cz);
    const [x0, y0, x1, y1, x2, y2] = [midX + ax * pa * px, midY - ay * pa * py, midX + bx * pb * px, midY - by * pb * py, midX + cx * pc * px, midY - cyy * pc * py];
    const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
    if (Math.abs(area) < 1e-4) continue;
    const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2)));
    const maxX = Math.min(cols - 1, Math.ceil(Math.max(x0, x1, x2)));
    const minY = Math.max(0, Math.floor(Math.min(y0, y1, y2)));
    const maxY = Math.min(rows - 1, Math.ceil(Math.max(y0, y1, y2)));
    for (let row = minY; row <= maxY; row += 1) {
      const sampleY = row + 0.5;
      for (let col = minX; col <= maxX; col += 1) {
        const sampleX = col + 0.5;
        const w0 = ((x1 - sampleX) * (y2 - sampleY) - (x2 - sampleX) * (y1 - sampleY)) / area;
        const w1 = ((x2 - sampleX) * (y0 - sampleY) - (x0 - sampleX) * (y2 - sampleY)) / area;
        const w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const z = w0 * az + w1 * bz + w2 * cz;
        const index = row * cols + col;
        if (z > depth[index]) {
          depth[index] = z;
          light[index] = shade;
        }
      }
    }
  }
  // Contornos: donde la profundidad salta, el carácter sube de brillo y la forma se lee mejor.
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      if (light[index] < 0) continue;
      const z = depth[index];
      const right = col + 1 < cols ? depth[index + 1] : -Infinity;
      const down = row + 1 < rows ? depth[index + cols] : -Infinity;
      if (Math.abs(z - right) > 0.07 || Math.abs(z - down) > 0.07) light[index] = Math.min(1, light[index] + 0.3);
    }
  }
}

// Atlas de glifos: copiar de aquí es varias veces más rápido que miles de fillText por cuadro.
export function createAtlas(fontSize, ratio, color) {
  const canvas = document.createElement('canvas');
  const probe = canvas.getContext('2d');
  const font = `${fontSize}px 'JetBrains Mono', ui-monospace, monospace`;
  probe.font = font;
  const cellW = probe.measureText('M').width || fontSize * 0.6;
  const cellH = fontSize * 1.12;
  canvas.width = Math.ceil(cellW * ratio) * RAMP.length;
  canvas.height = Math.ceil(cellH * ratio);
  const ctx = canvas.getContext('2d');
  const slot = Math.ceil(cellW * ratio);
  ctx.font = `${fontSize * ratio}px 'JetBrains Mono', ui-monospace, monospace`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = color;
  // La transparencia va horneada en cada glifo: cambiar globalAlpha por celda era lo más caro de dibujar.
  [...RAMP].forEach((char, index) => {
    ctx.globalAlpha = 0.3 + (0.7 * (index + 1)) / RAMP.length;
    ctx.fillText(char, index * slot, 0);
  });
  return { canvas, slot, height: canvas.height, cellW, cellH };
}

export const glyphIndex = (shade) => Math.min(RAMP.length - 1, Math.max(0, Math.floor(shade * RAMP.length)));

// El giro lo comparten todos los modelos: el mouse les da impulso y se van frenando.
export const spin = {
  velocity: 0,
  pointerY: 0.5,
  attached: false,
  attach() {
    if (this.attached) return;
    this.attached = true;
    let lastX = null;
    addEventListener('pointermove', (event) => {
      this.pointerY = event.clientY / innerHeight;
      if (lastX !== null && event.pointerType === 'mouse') {
        this.velocity = Math.max(-7, Math.min(7, this.velocity + (event.clientX - lastX) * 0.012));
      }
      lastX = event.clientX;
    }, { passive: true });
  },
  tick(dt) { this.velocity *= Math.exp(-dt * 1.9); },
};
