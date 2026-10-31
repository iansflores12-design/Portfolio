# Portfolio de Ian F

Sitio estático en HTML, CSS y JS. No necesita instalar nada ni compilar.

## Verlo en local

Usa módulos ES, así que abrir `index.html` con doble clic no funciona. Levanta un servidor:

```bash
python3 -m http.server 4173
```

Después abre http://localhost:4173.

## Editar

| Qué | Dónde |
|---|---|
| Enlaces y email (`[EDITAR]`) | `js/config.js` |
| Textos de la página | `index.html` |
| Textos que genera el JS (orbe, formulario) | `js/i18n.js` |
| ClearGrade, otros proyectos, stack | `js/projects.js` |
| PC y periféricos | `js/setup.js` |
| Canciones, juegos, películas y libros | `js/recs.js` |
| Entradas del blog (la nueva va arriba) | `js/blog.js` |
| Colores del sitio | `:root` y `[data-theme]` en `css/styles.css` |
| Dominio de Open Graph | `og:url` y `og:image` en `index.html` |

Un enlace con `[EDITAR]` sale marcado y no navega hasta que lo cambies.

### Agregar una entrada al blog

```js
{
  slug: 'mi-entrada',   // queda enlazable como #post-mi-entrada
  date: '2026-11-01',
  tag: 'tree',
  featured: false,      // true la deja abierta y destacada
  title: 'Título',
  body: ['Primer párrafo.', 'Segundo párrafo.'],
},
```

El blog también acepta subtítulos, citas, listas, código, imágenes, modelos 3D, Spotify, YouTube y enlaces. Los formatos están al inicio de `js/blog.js`.

### Agregar inglés

Llena `en` en `js/i18n.js` con las mismas claves, incluidos los `data-i18n` de `index.html`; lo que falte queda en español. En los archivos de datos, cualquier texto puede ser `{ es: '…', en: '…' }`. Falta añadir un botón que llame a `setLang('en')`.


## Modelos 3D y vidrio

Los modelos ASCII están en `js/models.js` y el motor en `js/ascii3d.js`. Cada `.flower-sep` de `index.html` elige `data-flower` (`lily`, `anemone`, `mac`, `arduino`, `gun` o `cube`) y `data-side` (`left` o `right`). La pantalla gris del Macintosh sale de `js/macsaver.js`. Los paneles de luz salen de `js/glass.js`: cada `canvas.glass` elige `data-scene` (`wave` o `flower`).

## Captura de ClearGrade

La captura del teléfono está en `assets/cleargrade-dashboard-claro.webp` y `-oscuro.webp`. Reemplázalas con los mismos nombres para cambiarla.

## Portadas

`js/covers.js` las busca sola, gratis y sin llaves: canciones en Spotify, juegos en Steam (con `steam: id`), películas en Wikipedia y libros en Open Library. Si una sale mal, fíjala con `cover: 'url'` en `js/recs.js`.

## Efecto de descifrado

`js/decode.js` descifra paneles y títulos al entrar en pantalla. Está inspirado en [ascii-reveal](https://quanhoangindex.github.io/ascii-reveal/), pero es código propio y no usa ese paquete.

## Desplegar

**GitHub Pages:** sube la carpeta a un repositorio y activa Settings → Pages → Deploy from a branch → `main` / `root`.

**Netlify:** arrastra la carpeta a https://app.netlify.com/drop, o conecta el repositorio sin comando de build y con `.` como carpeta de publicación.
