// Página de la propuesta para PC Builds Honduras (/propuesta/PCBH/).
// Usa la misma barra, tema y efectos del portfolio; aquí solo vive su contenido.
import { LINKS, isPlaceholder } from './config.js';
import { applyI18n, t } from './i18n.js';
import { initFlowers, initReveal } from './flowers.js';
import { initGlass } from './glass.js';
import { initDecode } from './decode.js';
import { initOrb } from './orb.js';

const $ = (selector) => document.querySelector(selector);
const DEMO = 'https://pcbuilds-honduras.vercel.app';
const OLD = 'pcbuildshonduras.com';

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

/* ---------------- contenido (edita aquí) ---------------- */

const SECTIONS = [
  { id: 'inicio', title: 'Inicio', old: '/', live: '/', changes: [
    'La portada vende: builds y componentes que se deslizan, con precio y Agregar al carrito',
    'Identidad propia en lugar de la plantilla de Odoo',
    'Cuotas, garantía, mantenimiento y sucursales a la vista',
  ] },
  { id: 'inicio-movil', title: 'Celular', old: '/', live: '/', phone: true, changes: [
    'Pensado primero para celular: se desliza con el dedo',
    'Menú simple con Cotizar siempre a mano',
  ] },
  { id: 'tienda', title: 'Tienda', old: '/shop', live: '/tienda', changes: [
    'El catálogo completo separado por categoría, como en el mostrador',
    'Vista en lista o cuadrícula, búsqueda, orden por precio y solo en stock',
    'Cada producto con su página: foto completa, ficha y Añadir al carrito',
  ] },
  { id: 'corporativo', title: 'Corporativo', old: '/corporativo', live: '/corporativo', changes: [
    'Las tres líneas (Slim, Creative, Performance) en una sola vista',
    'Formulario de cotización por volumen en la misma página',
  ] },
  { id: 'trabajos', title: 'Trabajos', old: '/jobs', live: '/trabajos', changes: [
    'Sin el texto de ejemplo de Odoo (correo y teléfono de prueba)',
    'Formulario de solicitud que llega a su correo',
  ] },
  { id: 'contacto', title: 'Contáctenos', old: '/contactus', live: '/contacto', changes: [
    'Las dos sucursales con mapa, teléfono y correo',
    'Formulario con asunto, que también recibe builds del configurador',
  ] },
];

const IMPROVEMENTS = [
  ['Identidad y diseño', 'ficha técnica', [
    'Identidad propia en lugar de la plantilla de Odoo',
    'Logo de cubos vectorizado y favicon propio (hoy muestra el de Odoo)',
    'Fotos de producto siempre completas, nunca recortadas',
    'Diseñado primero para celular, con modo oscuro',
  ]],
  ['Tienda', 'catálogo', [
    'Separada por categoría, en lista o cuadrícula',
    'Búsqueda, subcategorías, orden por precio y solo en stock',
    'Página propia por producto con cantidad, carrito y favoritos',
    'Stock visible: en stock, quedan pocos o agotado con aviso',
  ]],
  ['Ventas', 'carrito + pagos', [
    'Portada con builds y componentes que se deslizan',
    'El carrito se guarda y la persona sigue viendo la tienda',
    'PixelPay, BAC Credomatic, Tigo Money, transferencia o en tienda',
    'Pedidos con estado: pendiente, pagado, entregado',
  ]],
  ['Arma tu PC', 'configurador', [
    'Ocho pasos con revisión de socket, DDR, tamaño y potencia',
    'Si falta una pieza, el cliente la pide desde ahí',
    'El build llega armado al formulario de cotización',
  ]],
  ['Panel', 'como Odoo', [
    'Organizado como Odoo: app Sitio web, menú, Crear, lista y kanban',
    'Publicar productos subiendo la foto desde la computadora',
    'Precio y stock en la misma fila, con deshacer',
    'Una estrella elige qué sale en la portada; Lánzalo a mi web publica',
  ]],
  ['Velocidad y SEO', 'estático', [
    'Páginas estáticas que cargan rápido con datos móviles',
    'Imágenes livianas, adaptadas a cada pantalla',
    'Search Console y ficha de Google Maps en orden',
  ]],
];

const TRUST = [
  ['Lo ven antes de pagar', 'Les muestro el sitio funcionando en su computadora y en su celular, en el local.'],
  ['Pago por etapas', '50 % al empezar y 50 % cuando el sitio esté publicado a su gusto. Con recibo y acuerdo por escrito.'],
  ['Sin acceso a sus cuentas', 'No pido contraseñas de Odoo, del banco ni de redes. Las llaves del proveedor de pago las ponen ustedes.'],
  ['El código es suyo', 'Al terminar de pagar reciben el código fuente completo, legible y sin ejecutables. Lo puede revisar cualquier programador.'],
  ['Todo a su nombre', 'Dominio, hosting y cuentas quedan a nombre de PC Builds. Si un día cambian de proveedor, se lo llevan.'],
];

const PLANS = [
  { name: 'Sitio completo + integración con Odoo', price: 'L 3,000', note: 'pago único · L 1,500 al empezar y L 1,500 al publicar', featured: true, items: [
    'Todo el sitio nuevo: portada, tienda, página de cada producto, Corporativo, Trabajos y Contáctenos',
    'Panel para publicar productos, fotos, precios, stock y portada',
    'Arma tu PC, carrito, pedidos y su proveedor de pago',
    'Integración con Odoo: importa precios, stock y productos nuevos desde lo que exportan de Odoo',
    'Publicado en su dominio, sin mensualidad de hosting',
    'Capacitación y 1 mes de soporte',
  ] },
  { name: 'Mantenimiento', price: 'L 500', note: 'al mes · opcional', items: [
    'Cambios de contenido y productos que pidan',
    'Respaldos del catálogo y los pedidos',
    'Velocidad, errores y Google revisados cada mes',
  ] },
];

// Después, sin apuro: siempre pagan menos que hoy.
const PHASES = [
  ['1 · ahora', 'Sitio y tienda nuevos. Odoo sigue para todo lo demás.', 'L 3,000 una vez'],
  ['2 · cuando confíen', 'Inventario, pedidos, compras y caja pasan al panel, junto a Odoo unas semanas.', 'sin instalación con 12 meses de mantenimiento'],
  ['3 · apagar Odoo', 'Dejan de pagar Odoo. Su contador recibe las ventas como siempre.', 'máximo la mitad de lo que pagan hoy a Odoo'],
];

const EXTRAS = [
  ['Fotos de producto', 'L 80 c/u'],
  ['Correo con su dominio', 'incluido'],
  ['Dominio .com', '~L 350 / año'],
];

/* ---------------- render ---------------- */

function renderImprovements() {
  $('#improvements').append(...IMPROVEMENTS.map(([title, tag, items]) => el('li', { class: 'card' },
    el('h4', {}, title),
    el('span', { class: 'card-status' }, tag),
    el('ul', { class: 'pcbh-checks' }, ...items.map((item) => el('li', {}, item))),
  )));
}

function renderTrust() {
  $('#trust').append(...TRUST.map(([title, text]) => el('div', {}, el('dt', {}, title), el('dd', {}, text))));
}

function renderPlans() {
  $('#plans').append(...PLANS.map((plan) => {
    const card = el('li', { class: `card${plan.featured ? ' pcbh-featured' : ''}` },
      el('h4', {}, plan.name),
      el('span', { class: 'card-status' }, plan.note),
      el('strong', { class: 'pcbh-price' }, plan.price),
      el('ul', { class: 'pcbh-checks' }, ...plan.items.map((item) => el('li', {}, item))),
    );
    return card;
  }));
  $('#phases').append(...PHASES.map(([step, what, price]) => el('li', {}, el('b', {}, step), el('span', {}, what), el('strong', {}, price))));
  $('#extras').append(...EXTRAS.map(([name, price]) => el('li', {}, el('strong', {}, price), el('span', {}, name))));
}

/* ---------------- antes y después ---------------- */

function initCompare() {
  const frame = $('#compare');
  const beforeWrap = $('#baBeforeWrap');
  const handle = $('#baHandle');
  let pos = 50;
  let dragging = false;

  const set = (value) => {
    pos = Math.min(100, Math.max(0, value));
    beforeWrap.style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    handle.style.left = `${pos}%`;
    handle.setAttribute('aria-valuenow', String(Math.round(pos)));
  };
  const fromEvent = (event) => {
    const rect = frame.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * 100;
  };

  // Con mouse sigue al puntero; con el dedo se arrastra (así el scroll vertical sigue libre).
  frame.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'mouse' || dragging) set(fromEvent(event));
  });
  frame.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    dragging = true;
    set(fromEvent(event));
  });
  const stop = () => { dragging = false; };
  frame.addEventListener('pointerup', stop);
  frame.addEventListener('pointercancel', stop);
  handle.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 4;
    if (event.key === 'ArrowLeft') set(pos - step);
    else if (event.key === 'ArrowRight') set(pos + step);
    else if (event.key === 'Home') set(0);
    else if (event.key === 'End') set(100);
    else return;
    event.preventDefault();
  });
  set(50);

  const show = (section) => {
    frame.classList.toggle('is-phone', !!section.phone);
    $('#baAfter').src = `/assets/pcbh/despues-${section.id}.webp`;
    $('#baAfter').alt = `${section.title}: sitio nuevo`;
    $('#baBefore').src = `/assets/pcbh/antes-${section.id}.webp`;
    $('#baBefore').alt = `${section.title}: sitio actual en Odoo`;
    $('#baOld').textContent = `${OLD}${section.old}`;
    $('#baTitle').textContent = section.title;
    $('#baList').replaceChildren(...section.changes.map((change) => el('li', {}, change)));
    $('#baLive').href = `${DEMO}${section.live}`;
    frame.scrollTop = 0;
    set(50);
  };

  const tabs = $('#baTabs');
  tabs.append(...SECTIONS.map((section, index) => {
    const button = el('button', { type: 'button', role: 'tab', 'aria-selected': String(index === 0), 'aria-pressed': String(index === 0) }, section.title);
    button.addEventListener('click', () => {
      for (const other of tabs.children) {
        other.setAttribute('aria-selected', String(other === button));
        other.setAttribute('aria-pressed', String(other === button));
      }
      show(section);
    });
    return button;
  }));
  show(SECTIONS[0]);
}

/* ---------------- sello ---------------- */

// Huella de lo que se ofrece: si cambia un precio o una condición, cambia la huella.
async function sealProposal() {
  const out = $('#sealHash');
  try {
    const terms = JSON.stringify({ ref: 'PCBH-2026-01', valid: '2026-12-20', PLANS, PHASES, EXTRAS, TRUST });
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(terms));
    const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
    out.textContent = hex.slice(0, 16).match(/.{4}/g).join(' ');
    out.title = hex;
  } catch {
    out.textContent = 'PCBH-2026-01';
  }
}

/* ---------------- lo mismo que el portfolio ---------------- */

function initThemeToggle() {
  const root = document.documentElement;
  const button = $('#themeToggle');
  const meta = $('meta[name="theme-color"]');
  const sync = () => {
    const dark = root.dataset.theme === 'dark';
    button.setAttribute('aria-label', t(dark ? 'theme_to_light' : 'theme_to_dark'));
    meta.content = dark ? '#000000' : '#ffffff';
  };
  button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
    sync();
    document.dispatchEvent(new CustomEvent('site:theme'));
  });
  sync();
}

// The same script serves the short page (comparison only) and /completa/ (the whole proposal).
const has = (selector) => document.querySelector(selector) !== null;
applyI18n();
if (has('#improvements')) renderImprovements();
if (has('#trust')) renderTrust();
if (has('#plans')) renderPlans();
if (has('#compare')) initCompare();
if (has('#sealHash')) sealProposal();
if (has('#mailLink') && !isPlaceholder(LINKS.email)) $('#mailLink').href = `mailto:${LINKS.email}?subject=${encodeURIComponent('Propuesta sitio PC Builds')}`;
initThemeToggle();
initOrb($('#orb'));
initFlowers($('#flowers'));
initDecode();
initReveal();
initGlass();
$('#year').textContent = String(new Date().getFullYear());
