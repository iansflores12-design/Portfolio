// Portadas desde bases de datos gratis y sin llave. Se piden al acercarse a la sección y
// se guardan en localStorage, para no volver a preguntar en cada visita.
const CACHE_PREFIX = 'cover:v1:';

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

// Spotify: la portada real de la canción a partir de su enlace.
const fromSpotify = async (item) => {
  const data = await getJson(`https://open.spotify.com/oembed?url=${encodeURIComponent(item.href)}`);
  return data.thumbnail_url;
};

// Steam: la carátula vertical de cada juego sale directo de su número.
const fromSteam = async (item) => `https://cdn.akamai.steamstatic.com/steam/apps/${item.steam}/library_600x900.jpg`;

// Open Library: portadas de libros por título y autor.
const fromOpenLibrary = async (item) => {
  const query = new URLSearchParams({ title: item.title, limit: '1', fields: 'cover_i' });
  if (item.by) query.set('author', item.by);
  const data = await getJson(`https://openlibrary.org/search.json?${query}`);
  const id = data.docs?.[0]?.cover_i;
  return id ? `https://covers.openlibrary.org/b/id/${id}-M.jpg` : null;
};

// Wikipedia: el póster de la película. iTunes no devolvía resultados de cine.
const fromWikipedia = async (item) => {
  const query = new URLSearchParams({
    action: 'query', format: 'json', origin: '*', generator: 'search', gsrlimit: '1',
    gsrsearch: `${item.title} ${item.by ?? ''} film`.trim(),
    prop: 'pageimages', piprop: 'thumbnail', pithumbsize: '400', pilicense: 'any',
  });
  const data = await getJson(`https://en.wikipedia.org/w/api.php?${query}`);
  const page = Object.values(data.query?.pages ?? {})[0];
  return page?.thumbnail?.source ?? null;
};

const SOURCES = { songs: fromSpotify, games: fromSteam, books: fromOpenLibrary, movies: fromWikipedia };

export async function findCover(group, item) {
  if (item.cover) return item.cover;
  const source = SOURCES[group];
  if (!source) return null;
  const key = `${CACHE_PREFIX}${group}:${item.steam ?? item.href ?? ''}:${item.title}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) return cached;
  } catch {}
  const url = await source(item);
  if (url) {
    try { localStorage.setItem(key, url); } catch {}
  }
  return url;
}

// Sin red o sin resultado se queda el bloque ASCII con la inicial; nunca una imagen rota.
export function initCovers() {
  const slots = [...document.querySelectorAll('.rec-cover[data-group]')];
  const load = async (slot) => {
    try {
      const url = await findCover(slot.dataset.group, slot.item);
      if (!url) return;
      const image = new Image();
      image.alt = slot.dataset.alt;
      image.decoding = 'async';
      image.width = 240;
      image.height = 240;
      // Una imagen fuera del DOM con carga diferida nunca descarga: el observador ya hace ese trabajo.
      image.onload = () => slot.replaceChildren(image);
      image.src = url;
    } catch {}
  };
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      load(entry.target);
    }
  }, { rootMargin: '600px' });
  slots.forEach((slot) => observer.observe(slot));
}
