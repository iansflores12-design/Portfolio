// Los modelos 3D del sitio, armados con geometría. Para agregar uno: suma una función a
// BUILDERS y úsalo con data-flower="nombre" en index.html o { model: 'nombre' } en el blog.
import { Mesh } from './ascii3d.js';

const smooth = (low, high, value) => {
  const t = Math.min(1, Math.max(0, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};
const speckle = (a, b) => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

function lilyPetal(mesh, theta, length, width, arc, seed) {
  // La columna del pétalo: sale casi vertical y se curva hacia afuera y abajo.
  const steps = 24;
  const spine = [[0.05, 0, 0.12]];
  for (let i = 1; i <= steps; i += 1) {
    const u = i / steps;
    const phi = 0.12 + arc * u ** 1.3;
    const [r, h] = spine[i - 1];
    spine.push([r + (Math.sin(phi) * length) / steps, h + (Math.cos(phi) * length) / steps, phi]);
  }
  const [er, et] = [[Math.cos(theta), Math.sin(theta)], [-Math.sin(theta), Math.cos(theta)]];
  mesh.surface((u, t) => {
    const v = t * 2 - 1;
    const [r, h, phi] = spine[Math.round(u * steps)];
    const half = width * Math.max(0.03, Math.sin(Math.PI * Math.min(0.999, u ** 0.72)) ** 0.75);
    const cup = v * v * half * 0.5 + 0.018 * Math.sin(u * 19 + seed) * Math.abs(v);
    const radial = r + Math.cos(phi) * -cup;
    const lift = h + Math.sin(phi) * cup;
    const across = v * half;
    let tone = (0.42 + 0.58 * smooth(0.08, 0.72, u)) * (1 - 0.34 * Math.exp(-((v * 6) ** 2)));
    if (u < 0.62 && speckle(Math.round(u * 26) + seed, Math.round(v * 9)) > 0.84) tone *= 0.42;
    return [er[0] * radial + et[0] * across, lift, er[1] * radial + et[1] * across, tone];
  }, 18, 10);
}

function stemAndLeaves(mesh, bottom, tone) {
  const lean = -0.08;
  mesh.tube([0, 0.02, 0], [lean, bottom, 0.02], 0.034, 0.042, 7, tone);
  for (const [at, side] of [[0.5, 1], [0.76, -1]]) {
    const startY = bottom * at;
    mesh.surface((u, t) => {
      const v = t * 2 - 1;
      const half = 0.1 * Math.sin(Math.PI * Math.min(0.999, u ** 0.7));
      const outward = side * (0.03 + u * 0.72);
      return [lean * at + outward, startY + u * 0.62 - u * u * 0.62, v * half + Math.abs(v) * 0.02, tone * (0.72 + 0.4 * u) * (1 - 0.3 * Math.exp(-((v * 5) ** 2)))];
    }, 10, 4);
  }
}

function lily() {
  const mesh = new Mesh();
  for (let i = 0; i < 3; i += 1) lilyPetal(mesh, rad(i * 120 + 60), 1.0, 0.27, 1.62, i * 3.1 + 7);
  for (let i = 0; i < 3; i += 1) lilyPetal(mesh, rad(i * 120), 1.1, 0.33, 1.5, i * 2.3);
  for (let i = 0; i < 6; i += 1) {
    const theta = rad(i * 60 + 18);
    const [cos, sin] = [Math.cos(theta), Math.sin(theta)];
    const mid = [cos * 0.13, 0.42, sin * 0.13];
    const tip = [cos * 0.27, 0.72, sin * 0.27];
    mesh.tube([0, 0.05, 0], mid, 0.02, 0.018, 5, 0.86);
    mesh.tube(mid, tip, 0.018, 0.015, 5, 0.86);
    mesh.box(tip[0], tip[1] + 0.012, tip[2], 0.12, 0.042, 0.042, 1);
  }
  mesh.tube([0, 0.05, 0], [0, 0.8, 0], 0.024, 0.02, 6, 0.9);
  mesh.sphere([0, 0.82, 0], 0.052, 4, 1);
  stemAndLeaves(mesh, -1.2, 0.44);
  return mesh.finish();
}

// La anémona de la flor morada: pétalos anchos y separados, centro oscuro y corona de estambres.
function anemone() {
  const mesh = new Mesh();
  for (let i = 0; i < 6; i += 1) lilyPetal(mesh, rad(i * 60 + 30), 0.86, 0.3, 1.5, i * 4.1 + 2);
  for (let i = 0; i < 6; i += 1) lilyPetal(mesh, rad(i * 60), 0.98, 0.31, 1.32, i * 1.7 + 9);
  mesh.sphere([0, 0.2, 0], 0.15, 7, 0.1);
  for (let i = 0; i < 22; i += 1) {
    const theta = i * 2.39996;
    const reach = 0.19 + (i % 3) * 0.035;
    const tip = [Math.cos(theta) * reach, 0.32 + (i % 2) * 0.03, Math.sin(theta) * reach];
    mesh.tube([Math.cos(theta) * 0.1, 0.16, Math.sin(theta) * 0.1], tip, 0.012, 0.01, 4, 0.5);
    mesh.sphere(tip, 0.028, 3, 1);
  }
  stemAndLeaves(mesh, -1.2, 0.42);
  return mesh.finish();
}

const HAPPY_MAC = [
  '0111111111110',
  '1000000000001',
  '1011111111101',
  '1010000000101',
  '1010110110101',
  '1010000000101',
  '1010001000101',
  '1010011000101',
  '1010000000101',
  '1010100010101',
  '1010011100101',
  '1010000000101',
  '1011111111101',
  '1000000000001',
  '1000000111001',
  '1000000000001',
  '0111111111110',
];

function macintosh() {
  const mesh = new Mesh();
  mesh.box(0, 0.12, -0.05, 1.04, 1.38, 1.12, 0.8);
  mesh.box(0, 0.12, 0.52, 0.98, 1.3, 0.04, 0.88);
  mesh.box(0, 0.34, 0.545, 0.76, 0.66, 0.03, 0.42);
  mesh.box(0, 0.34, 0.565, 0.66, 0.56, 0.02, 1.82);
  const pixel = 0.024;
  HAPPY_MAC.forEach((line, row) => {
    [...line].forEach((bit, col) => {
      if (bit === '1') mesh.box((col - 6) * pixel, 0.34 + (8 - row) * pixel, 0.578, pixel, pixel, 0.01, 1.08);
    });
  });
  mesh.box(0.2, -0.22, 0.548, 0.3, 0.035, 0.02, 0.08);
  mesh.box(0.2, -0.22, 0.54, 0.34, 0.07, 0.02, 0.55);
  mesh.box(-0.36, -0.42, 0.545, 0.05, 0.05, 0.015, 0.35);
  for (let i = 0; i < 6; i += 1) mesh.box(0, 0.76 - i * 0.045, -0.3, 1.05, 0.018, 0.4, 0.3);
  mesh.box(0, 0.82, -0.2, 0.34, 0.03, 0.2, 0.25);
  mesh.box(0, -0.6, 0.02, 0.9, 0.06, 0.9, 0.42);
  mesh.box(0, -0.74, 1.02, 1.0, 0.07, 0.42, 0.68);
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 11; col += 1) {
      mesh.box((col - 5) * 0.086, -0.692, 0.88 + row * 0.082, 0.07, 0.03, 0.066, 0.96);
    }
  }
  mesh.box(0.7, -0.74, 1.02, 0.17, 0.07, 0.28, 0.82);
  mesh.box(0.7, -0.698, 0.93, 0.13, 0.015, 0.07, 0.4);
  return mesh.finish();
}

const SILK = {
  A: ['010', '101', '111', '101', '101'], R: ['110', '101', '110', '101', '101'], D: ['110', '101', '101', '101', '110'],
  U: ['101', '101', '101', '101', '111'], I: ['111', '010', '010', '010', '111'], N: ['101', '111', '111', '111', '101'], O: ['111', '101', '101', '101', '111'],
};

// Arduino Uno R3 según la placa real: USB y jack a la izquierda, headers en los dos bordes
// largos y el ATmega328P en su zócalo abajo a la derecha.
function arduino() {
  const mesh = new Mesh();
  const TOP = 0.03;
  const PCB = 0.5;

  // Placa con el borde derecho recortado, y agujeros de montaje.
  mesh.box(-0.06, 0, 0, 1.5, 0.06, 1.24, PCB);
  mesh.box(0.73, 0, -0.01, 0.08, 0.06, 1.0, PCB);
  mesh.box(0.8, 0, -0.03, 0.06, 0.06, 0.72, PCB);
  for (const [x, z] of [[-0.62, -0.54], [-0.56, 0.54], [0.58, -0.54], [0.74, 0.3]]) {
    mesh.tube([x, TOP, z], [x, TOP + 0.004, z], 0.042, 0.042, 12, 0.92);
    mesh.tube([x, TOP + 0.004, z], [x, TOP + 0.008, z], 0.024, 0.024, 10, 0.03);
  }

  // Serigrafía: pistas y marcos claros sobre la placa.
  const trace = (x, z, sx, sz, tone = 0.72) => mesh.box(x, TOP + 0.002, z, sx, 0.004, sz, tone);
  for (let i = 0; i < 9; i += 1) trace(-0.02 + i * 0.075, -0.3, 0.012, 0.42, 0.66);
  for (let i = 0; i < 6; i += 1) trace(-0.5 + i * 0.07, 0.36, 0.012, 0.3, 0.66);
  trace(-0.2, -0.47, 0.5, 0.012, 0.8);
  trace(0.3, 0.47, 0.82, 0.012, 0.8);

  const silkText = (word, x, z, pixel) => {
    [...word].forEach((char, index) => {
      SILK[char].forEach((row, j) => [...row].forEach((bit, i) => {
        if (bit === '1') mesh.box(x + (index * 4 + i) * pixel, TOP + 0.004, z + j * pixel, pixel, 0.006, pixel, 1);
      }));
    });
  };
  silkText('ARDUINO', -0.02, -0.32, 0.028);
  silkText('UNO', 0.5, -0.08, 0.03);
  for (const dx of [0, 0.1]) {
    mesh.tube([0.1 + dx, TOP + 0.002, -0.12], [0.1 + dx, TOP + 0.007, -0.12], 0.058, 0.058, 16, 1);
    mesh.tube([0.1 + dx, TOP + 0.007, -0.12], [0.1 + dx, TOP + 0.011, -0.12], 0.032, 0.032, 12, PCB);
  }

  // USB tipo B: caja metálica con boca negra y su lengüeta.
  mesh.box(-0.72, 0.18, 0.2, 0.46, 0.3, 0.4, 0.98);
  mesh.box(-0.95, 0.18, 0.2, 0.012, 0.22, 0.32, 0.05);
  mesh.box(-0.945, 0.18, 0.2, 0.02, 0.09, 0.18, 0.72);
  for (const ry of [0.1, 0.26]) mesh.box(-0.72, ry, 0.402, 0.36, 0.012, 0.006, 0.45);

  // Jack de alimentación.
  mesh.box(-0.74, 0.17, -0.38, 0.42, 0.28, 0.26, 0.13);
  mesh.tube([-0.95, 0.17, -0.38], [-0.965, 0.17, -0.38], 0.1, 0.1, 14, 0.34);
  mesh.tube([-0.965, 0.17, -0.38], [-0.97, 0.17, -0.38], 0.066, 0.066, 12, 0.02);
  mesh.tube([-0.97, 0.17, -0.38], [-0.975, 0.17, -0.38], 0.02, 0.02, 8, 0.95);

  // Headers hembra con cada pin visible.
  const header = (startX, z, count) => {
    const pitch = 0.054;
    mesh.box(startX + ((count - 1) * pitch) / 2, 0.1, z, count * pitch, 0.14, 0.066, 0.12);
    for (let i = 0; i < count; i += 1) {
      mesh.box(startX + i * pitch, 0.172, z, 0.026, 0.004, 0.026, 0.02);
      mesh.box(startX + i * pitch, 0.1, z + 0.034, 0.008, 0.08, 0.002, 0.34);
    }
  };
  header(-0.12, -0.56, 10);
  header(0.42, -0.56, 8);
  header(-0.14, 0.56, 8);
  header(0.34, 0.56, 6);

  // Dos ICSP: pines macho dorados sobre base negra.
  const icsp = (cx, cz) => {
    mesh.box(cx, 0.05, cz, 0.17, 0.04, 0.115, 0.14);
    for (const dx of [-0.054, 0, 0.054]) {
      for (const dz of [-0.027, 0.027]) mesh.box(cx + dx, 0.13, cz + dz, 0.018, 0.13, 0.018, 1);
    }
  };
  icsp(0.72, 0.02);
  icsp(-0.42, -0.14);

  // ATmega328P: zócalo, cuerpo, muesca, rótulo y las 28 patas.
  mesh.box(0.26, 0.05, 0.28, 0.86, 0.04, 0.3, 0.3);
  mesh.box(0.26, 0.105, 0.28, 0.8, 0.07, 0.22, 0.1);
  mesh.tube([-0.12, 0.14, 0.28], [-0.12, 0.144, 0.28], 0.025, 0.025, 10, 0.5);
  for (const [z, length] of [[0.235, 0.5], [0.28, 0.6], [0.325, 0.36]]) mesh.box(0.31, 0.142, z, length, 0.003, 0.014, 0.6);
  for (let i = 0; i < 14; i += 1) {
    const x = -0.09 + i * 0.054;
    for (const z of [0.15, 0.41]) {
      mesh.box(x, 0.09, z, 0.024, 0.05, 0.026, 0.95);
      mesh.box(x, 0.045, z + (z < 0.28 ? -0.01 : 0.01), 0.024, 0.04, 0.024, 0.7);
    }
  }

  // ATmega16U2: chip cuadrado con patas por los cuatro lados.
  mesh.box(-0.3, 0.052, -0.3, 0.13, 0.04, 0.13, 0.1);
  for (let i = 0; i < 6; i += 1) {
    const offset = -0.05 + i * 0.02;
    mesh.box(-0.3 + offset, 0.04, -0.375, 0.01, 0.014, 0.02, 0.9);
    mesh.box(-0.3 + offset, 0.04, -0.225, 0.01, 0.014, 0.02, 0.9);
    mesh.box(-0.375, 0.04, -0.3 + offset, 0.02, 0.014, 0.01, 0.9);
    mesh.box(-0.225, 0.04, -0.3 + offset, 0.02, 0.014, 0.01, 0.9);
  }

  // Cristal, dos capacitores electrolíticos con su cruz, regulador y botón de reset.
  mesh.box(-0.16, 0.085, -0.04, 0.16, 0.1, 0.07, 0.96);
  mesh.tube([-0.24, 0.085, -0.04], [-0.26, 0.085, -0.04], 0.035, 0.03, 8, 0.96);
  mesh.tube([-0.08, 0.085, -0.04], [-0.06, 0.085, -0.04], 0.035, 0.03, 8, 0.96);
  for (const x of [-0.5, -0.36]) {
    mesh.tube([x, TOP, -0.44], [x, 0.26, -0.44], 0.062, 0.062, 14, 0.82);
    mesh.tube([x, 0.26, -0.44], [x, 0.268, -0.44], 0.058, 0.058, 14, 0.96);
    mesh.box(x, 0.27, -0.44, 0.1, 0.004, 0.01, 0.2);
    mesh.box(x, 0.27, -0.44, 0.01, 0.004, 0.1, 0.2);
    mesh.box(x + 0.056, 0.14, -0.44, 0.012, 0.2, 0.05, 0.25);
  }
  mesh.box(-0.54, 0.08, 0.52, 0.17, 0.1, 0.13, 0.12);
  mesh.box(-0.54, 0.145, 0.47, 0.17, 0.05, 0.02, 0.9);
  for (const dx of [-0.05, 0, 0.05]) mesh.box(-0.54 + dx, 0.045, 0.6, 0.02, 0.02, 0.05, 0.9);
  mesh.box(-0.62, 0.07, -0.13, 0.11, 0.08, 0.11, 0.86);
  mesh.tube([-0.62, 0.11, -0.13], [-0.62, 0.145, -0.13], 0.032, 0.032, 10, 0.18);

  // Resistencias y capacitores de montaje superficial.
  for (const [x, z] of [[-0.05, 0.02], [0.02, 0.02], [0.09, 0.02], [0.16, 0.02], [-0.24, 0.1], [-0.17, 0.1], [-0.1, 0.1], [0.5, 0.04], [0.57, 0.04], [-0.42, 0.06], [-0.35, 0.06], [-0.3, -0.14]]) {
    mesh.box(x, 0.042, z, 0.038, 0.02, 0.022, 0.2);
    mesh.box(x - 0.018, 0.042, z, 0.008, 0.022, 0.024, 0.95);
    mesh.box(x + 0.018, 0.042, z, 0.008, 0.022, 0.024, 0.95);
  }

  // LEDs ON, L, TX y RX encendidos.
  for (const [x, z, tone] of [[0.28, -0.42, 1.98], [0.16, -0.42, 1.7], [0.16, -0.36, 1.7], [0.28, -0.36, 1.98]]) {
    mesh.box(x, 0.045, z, 0.04, 0.026, 0.026, tone);
  }
  return mesh.finish();
}

// La pistola de portales vista de lado: boca a la izquierda, carcasa blanca a la derecha.
function curve(mesh, p0, p1, p2, p3, radius, tone, steps = 10) {
  const at = (t) => [0, 1, 2].map((k) => (1 - t) ** 3 * p0[k] + 3 * (1 - t) ** 2 * t * p1[k] + 3 * (1 - t) * t * t * p2[k] + t ** 3 * p3[k]);
  for (let i = 0; i < steps; i += 1) mesh.tube(at(i / steps), at((i + 1) / steps), radius, radius, 5, tone);
}

function portalGun() {
  const mesh = new Mesh();
  const ring = (a, b, r1, r2, tone, seg = 16) => mesh.tube([a, 0, 0], [b, 0, 0], r1, r2, seg, tone);
  const DARK = 0.2;

  // Boca: goma ancha, anillos y el bloque que sostiene las garras.
  ring(-1.02, -0.9, 0.2, 0.25, DARK);
  ring(-0.9, -0.82, 0.25, 0.2, 0.3);
  ring(-0.82, -0.68, 0.22, 0.22, DARK);
  ring(-0.68, -0.62, 0.2, 0.19, 0.34);
  ring(-0.62, -0.26, 0.18, 0.18, DARK);
  mesh.box(-0.3, 0.02, 0.17, 0.09, 0.09, 0.02, 0.8);

  // Cámara de vidrio: tubo tenue con el núcleo encendido abajo.
  ring(-0.26, 0.24, 0.135, 0.135, 0.36);
  mesh.tube([-0.2, -0.07, 0], [0.19, -0.07, 0], 0.05, 0.05, 8, 1.98);
  mesh.tube([-0.26, 0, 0], [-0.21, 0, 0], 0.15, 0.15, 12, 0.62);
  mesh.tube([0.2, 0, 0], [0.25, 0, 0], 0.15, 0.15, 12, 0.62);
  mesh.box(0, -0.17, 0, 0.56, 0.08, 0.22, DARK);
  ring(0.24, 0.42, 0.17, 0.31, DARK);

  // Carcasa blanca: ancha al frente, afinándose hacia atrás, con el canto delantero marcado.
  mesh.surface((u, t) => {
    const angle = t * Math.PI * 2;
    const x = 0.4 + u * 1.04;
    const radius = 0.16 + 0.26 * Math.sin(Math.PI * Math.min(1, 0.32 + u * 0.72)) ** 0.8 - u * u * 0.1;
    const flat = Math.sin(angle) > 0 ? 0.92 : 1.06;
    const lean = 0.03 + u * 0.1;
    return [x, Math.sin(angle) * radius * flat + lean, Math.cos(angle) * radius * 0.92, 1];
  }, 14, 20);
  mesh.tube([0.4, 0.03, 0], [0.42, 0.03, 0], 0.33, 0.33, 20, 0.12);
  mesh.sphere([0.68, 0.46, 0.02], 0.03, 4, 2);
  mesh.sphere([0.78, -0.01, 0.39], 0.055, 5, 0.92);

  // Mango oscuro que asoma por debajo y remata atrás.
  curve(mesh, [0.46, -0.33, 0], [0.82, -0.42, 0], [1.2, -0.38, 0], [1.5, -0.22, 0], 0.075, DARK, 10);
  mesh.tube([1.47, -0.22, 0], [1.56, -0.17, 0], 0.09, 0.09, 10, 0.3);

  // Cubierta blanca baja, junto a la boca.
  mesh.surface((u, t) => {
    const angle = Math.PI * (1.12 + t * 0.76);
    const x = -0.72 + u * 0.8;
    const bulge = Math.sin(Math.PI * u);
    const radius = 0.21 + 0.13 * bulge;
    return [x, Math.sin(angle) * radius - 0.06 * bulge, Math.cos(angle) * radius, 0.96];
  }, 10, 10);

  // Garras: una arriba y dos abajo, cada una con brazo, manga y punta.
  const claw = (base, elbow, sleeveEnd, knuckle, tip) => {
    mesh.tube(base, elbow, 0.022, 0.022, 5, 0.3);
    mesh.tube(elbow, sleeveEnd, 0.022, 0.022, 5, 0.3);
    const sleeve = [(elbow[0] + sleeveEnd[0]) / 2, (elbow[1] + sleeveEnd[1]) / 2, (elbow[2] + sleeveEnd[2]) / 2];
    mesh.tube(elbow, sleeve, 0.034, 0.034, 6, 0.42);
    mesh.tube(sleeveEnd, knuckle, 0.024, 0.024, 5, 0.3);
    mesh.tube(knuckle, tip, 0.04, 0.008, 6, 0.42);
  };
  claw([-0.42, 0.18, 0], [-0.58, 0.7, 0], [-0.94, 0.74, 0], [-1.14, 0.72, 0], [-1.26, 0.46, 0]);
  for (const side of [-1, 1]) {
    const z = side * 0.17;
    claw([-0.34, -0.3, side * 0.1], [-0.72, -0.5, z], [-1.08, -0.54, z], [-1.3, -0.52, z], [-1.42, -0.66, z]);
  }

  // Cables.
  curve(mesh, [-0.44, 0.2, 0], [-0.22, 0.56, 0], [0.12, 0.5, 0], [0.42, 0.28, 0], 0.016, 0.48, 12);
  curve(mesh, [-0.36, -0.32, 0.14], [0.02, -0.5, 0.2], [0.24, -0.12, 0.34], [0.74, -0.01, 0.39], 0.016, 0.48, 12);
  return mesh.finish();
}

const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];

function companionCube() {
  const mesh = new Mesh();
  mesh.box(0, 0, 0, 1.3, 1.3, 1.3, 0.52);
  for (const x of [-1, 1]) {
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        const at = 0.5;
        mesh.box(x * at, y * at, z * at, 0.42, 0.42, 0.42, 0.94);
        mesh.box(x * (at + 0.015), y * (at + 0.015), z * (at + 0.015), 0.28, 0.28, 0.28, 0.72);
      }
    }
  }
  for (const a of [-1, 1]) {
    for (const b of [-1, 1]) {
      mesh.box(a * 0.65, b * 0.65, 0, 0.05, 0.05, 0.6, 0.3);
      mesh.box(0, a * 0.65, b * 0.65, 0.6, 0.05, 0.05, 0.3);
      mesh.box(a * 0.65, 0, b * 0.65, 0.05, 0.6, 0.05, 0.3);
    }
  }
  const faces = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, 1]], [[0, 0, 1], [0, 1, 0], [1, 0, 0]], [[0, 0, -1], [0, 1, 0], [1, 0, 0]], [[0, 1, 0], [1, 0, 0], [0, 0, 1]], [[0, -1, 0], [1, 0, 0], [0, 0, 1]]];
  const pixel = 0.09;
  for (const [n, right, up] of faces) {
    const at = (a, b, depth) => [0, 1, 2].map((k) => n[k] * depth + right[k] * a + up[k] * b);
    // Líneas rosas que cruzan la cara desde el disco hasta los bordes, como en el cubo del juego.
    for (const side of [-1, 1]) {
      for (const [a, b, w, h] of [[side * 0.5, 0, 0.3, 0.025], [0, side * 0.5, 0.025, 0.3]]) {
        const c = at(a, b, 0.655);
        mesh.box(c[0], c[1], c[2], Math.abs(n[0]) ? 0.02 : (Math.abs(right[0]) ? w : h), Math.abs(n[1]) ? 0.02 : (Math.abs(right[1]) ? w : (Math.abs(up[1]) ? h : w)), Math.abs(n[2]) ? 0.02 : (Math.abs(right[2]) ? w : h), 0.16);
      }
    }
    mesh.tube(at(0, 0, 0.64), at(0, 0, 0.67), 0.36, 0.35, 18, 0.26);
    mesh.tube(at(0, 0, 0.665), at(0, 0, 0.69), 0.3, 0.29, 18, 0.98);
    HEART.forEach((line, row) => {
      [...line].forEach((bit, col) => {
        if (bit !== '1') return;
        const c = at((col - 3) * pixel, (2.5 - row) * pixel * 1, 0.7);
        mesh.box(c[0], c[1], c[2], Math.abs(n[0]) ? 0.02 : pixel, Math.abs(n[1]) ? 0.02 : pixel, Math.abs(n[2]) ? 0.02 : pixel, 0.16);
      });
    });
  }
  return mesh.finish();
}

function rad(degrees) { return (degrees * Math.PI) / 180; }

// `pitch` es la inclinación inicial: el Arduino se mira desde arriba; la pistola, de lado.
const BUILDERS = {
  lily: { build: lily, pitch: 0.95 },
  anemone: { build: anemone, pitch: 1.0 },
  mac: { build: macintosh, pitch: 0.26 },
  arduino: { build: arduino, pitch: 1.02 },
  gun: { build: portalGun, pitch: 0.1 },
  cube: { build: companionCube, pitch: 0.5 },
};

const built = new Map();

export function getModel(name) {
  const entry = BUILDERS[name];
  if (!entry) return null;
  if (!built.has(name)) built.set(name, { mesh: entry.build(), pitch: entry.pitch });
  return built.get(name);
}
