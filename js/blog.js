// La bitácora. La entrada nueva va arriba; `featured: true` la deja abierta y destacada.
// Cada elemento de `body` puede ser un párrafo ('texto') o un bloque:
//   { h: 'Subtítulo' }                    { quote: 'Cita' }
//   { list: ['uno', 'dos'] }              { code: 'npm run dev' }
//   { img: 'assets/foto.jpg', alt: 'Qué se ve', caption: 'Opcional' }
//   { model: 'gun', caption: 'Opcional' } modelos: lily, anemone, mac, arduino, gun, cube
//   { spotify: 'enlace de la canción' }   { youtube: 'id del video' }
//   { link: 'https://…', label: 'Texto' }
export const posts = [
  {
    slug: 'redacted-file',
    date: '2026-10-30',
    tag: 'juego',
    featured: true,
    title: 'Redacted File entra en desarrollo temprano',
    body: [
      'Estoy empezando Redacted File, el Juego 1 de la pentalogía Entropy & Power: un thriller de investigación y terminal, en 2D y 3D.',
      'Juegas como Nova, un analista que va destapando la verdad detrás de un caso de corrupción de 40 millones. Todo gira alrededor de una hora: 11:34.',
      { quote: '11:34' },
      'Es lo que a mí me gusta jugar: una historia lineal, con identidad y buen game feel. Todavía es muy temprano, así que no hay fecha. Cuando haya algo que enseñar, aparece aquí.',
    ],
  },
  {
    slug: 'tree',
    date: '2026-10-30',
    tag: 'tree',
    featured: false,
    title: 'Qué es Tree',
    body: [
      'Tree es el proyecto que quiero fundar: un ecosistema tecnológico y una startup enfocada en hardware, software e IA.',
      'La idea es que las tres cosas se diseñen juntas en vez de pegarse al final. Por ahora es visión y planificación; todavía no hay producto que anunciar.',
      { model: 'arduino', caption: 'Arduino Uno en ASCII. Arrástralo para girarlo.' },
    ],
  },
  {
    slug: 'cleargrade-frosted',
    date: '2026-10-17',
    tag: 'cleargrade',
    featured: false,
    title: 'ClearGrade suma Frosted y llega a 14 temas',
    body: [
      'Frosted es vidrio esmerilado al estilo de Android 17: paneles lechosos que toman el color que elijas, también en los fondos.',
      'Salió en Bambú 3.17.0, junto con una web bastante más ligera.',
    ],
  },
];
