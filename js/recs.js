// Lo que recomiendo. Para agregar algo, suma un objeto a la lista que toque:
// { title, by, note, href, cta, cover }. Solo `title` es obligatorio. La portada se busca
// sola (Spotify, Steam con `steam: id`, Wikipedia, Open Library); `cover` la fija a mano.
// Una lista vacía sale como [EDITAR] en la página.
const steam = (id) => `https://store.steampowered.com/app/${id}/`;

export const recs = [
  {
    id: 'songs',
    title: 'Canciones',
    items: [
      {
        title: 'Vital Signs (cover)',
        by: 'Tame Impala · original de Midnight Juggernauts',
        href: 'https://open.spotify.com/track/1FsPinqSsFnPIKXfm8SHJM',
        cta: 'Escuchar en Spotify',
        playing: true,
      },
    ],
  },
    {
    id: 'movies',
    title: 'Películas',
    items: [
      { title: 'Inception', by: 'Christopher Nolan · 2010', note: 'Un ladrón que roba ideas dentro de los sueños.' },
      { title: 'Interstellar', by: 'Christopher Nolan · 2014', note: 'Un viaje por un agujero de gusano para salvar a la humanidad.' },
    ],
  },
  {
    id: 'books',
    title: 'Libros',
    items: [
      { title: 'Supremacía cuántica', by: 'Michio Kaku', cover: 'https://covers.openlibrary.org/b/id/14248071-M.jpg', note: 'Hacia dónde van la computación cuántica y la inteligencia artificial.' },
      { title: 'Just for Fun', by: 'Linus Torvalds y David Diamond', note: 'La historia de Linux contada por el propio Linus.', cover: 'assets/just-for-fun.jpg' },
      { title: 'Steve Jobs', by: 'Walter Isaacson', note: 'La biografía autorizada del fundador de Apple.' },
    ],
  },
  {
    id: 'games',
    title: 'Juegos',
    items: [
      { title: 'Control', by: 'Remedy · 2019', note: 'Thriller sobrenatural dentro de un edificio federal que cambia de forma.', steam: 870780, href: steam(870780), cta: 'Ver en Steam' },
      { title: 'Detroit: Become Human', by: 'Quantic Dream · 2018', note: 'Tres androides toman conciencia y tus decisiones cambian la historia.', steam: 1222140, href: steam(1222140), cta: 'Ver en Steam' },
      { title: 'Half-Life', by: 'Valve · 1998', note: 'Un shooter que cuenta su historia sin sacarte nunca del juego.', steam: 70, href: steam(70), cta: 'Ver en Steam' },
      { title: 'Portal', by: 'Valve · 2007', note: 'Puzzles con portales y una IA que no para de hablarte.', steam: 400, href: steam(400), cta: 'Ver en Steam' },
    ],
  },
];
