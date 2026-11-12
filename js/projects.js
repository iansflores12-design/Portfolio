// Los otros proyectos. Para agregar uno, suma un objeto a `projects`.
// Cualquier texto puede ser "texto" o { es: 'texto', en: 'text' }.
import { AGENCY_NAME } from './config.js';

export const projects = [
  {
    name: AGENCY_NAME,
    status: 'En lanzamiento',
    description: 'Agencia para negocios locales de Tegucigalpa: web ultrarrápida, Google Maps en orden y placa NFC de reseñas.',
    links: [{ label: 'Ver la sección', href: '#agencia' }, { label: 'Por qué Google Maps', href: '#post-agencia-local' }],
  },
  {
    name: 'Tree',
    status: 'En planificación',
    description: 'Mi futuro ecosistema tecnológico y startup: hardware, software e IA bajo un mismo techo.',
    links: [],
  },
  {
    name: 'Redacted File',
    status: 'Desarrollo temprano',
    description: 'Juego 1 de la pentalogía Entropy & Power: thriller de investigación y terminal en 2D/3D.',
    links: [{ label: 'Leer el anuncio', href: '#post-redacted-file' }],
  },
];

export const stack = [
  'React', 'Next.js', 'Python', 'Arch Linux', 'PWA', 'Web Audio API',
  'WebSocket', 'Ollama', 'Gemini API', 'Discord bots', 'Arduino',
];
