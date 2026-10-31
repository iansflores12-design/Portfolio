// El español de la página vive en index.html, para que se pinte sin esperar al JS; aquí
// está el de lo que genera el JS. Para agregar inglés: llena `en` con las mismas claves,
// incluidos los data-i18n del HTML (lo que falte queda en español), y llama setLang('en').
const STRINGS = {
  es: {
    recs_cover: 'Portada de',
    blog_all: 'todo',
    blog_filter: 'Filtrar entradas por tema',
    blog_copy: 'Copiar enlace',
    blog_copied: 'Enlace copiado',
    recs_empty: 'Agrega la tuya en js/recs.js',
    theme_to_light: 'Cambiar a modo claro',
    theme_to_dark: 'Cambiar a modo oscuro',



    blog_featured: 'destacado',

    contact_email: 'Email',
    contact_github: 'GitHub',
    contact_discord: 'Discord',
    form_missing: 'El email de contacto todavía no está configurado.',
    form_subject: 'Mensaje desde el portfolio de',

    placeholder_title: 'Falta completar este enlace en js/config.js',

    orb_open: 'Abrir monitor del sistema',
    orb_close: 'Cerrar monitor del sistema',
    orb_title: 'monitor',
    orb_time: 'hora',
    orb_uptime: 'sesión',
    orb_cursor: 'cursor',
    orb_viewport: 'ventana',
    orb_scroll: 'scroll',
    orb_fps: 'fps',
    orb_cores: 'núcleos',
    orb_net: 'red',
    orb_online: 'en línea',
    orb_offline: 'sin conexión',
    orb_theme: 'modo',
  },
  en: {},
};

let lang = 'es';
try {
  const saved = localStorage.getItem('lang');
  if (saved && STRINGS[saved]) lang = saved;
} catch {}

export const t = (key) => STRINGS[lang][key] ?? STRINGS.es[key] ?? key;

// Para los textos de los archivos de datos: "texto" o { es, en }.
export const loc = (value) => (typeof value === 'string' ? value : value[lang] ?? value.es);

export function applyI18n(root = document) {
  document.documentElement.lang = lang;
  for (const el of root.querySelectorAll('[data-i18n]')) {
    const text = STRINGS[lang][el.dataset.i18n];
    if (text) el.textContent = text;
  }
}

export function setLang(next) {
  if (!STRINGS[next]) return;
  lang = next;
  try { localStorage.setItem('lang', next); } catch {}
  location.reload();
}
