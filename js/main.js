import { LINKS, isPlaceholder } from './config.js';
import { applyI18n, t, loc } from './i18n.js';
import { projects, stack } from './projects.js';
import { setup } from './setup.js';
import { posts } from './blog.js';
import { recs } from './recs.js';
import { initPortals } from './portal.js';
import { initFlowers, initReveal, mountModel } from './flowers.js';
import { initCovers } from './covers.js';
import { initMacSaver } from './macsaver.js';
import { initGlass } from './glass.js';
import { initDecode } from './decode.js';
import { initDotMatrix } from './dotmatrix.js';
import { initOrb } from './orb.js';

const $ = (selector) => document.querySelector(selector);

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  node.append(...children);
  return node;
}

// Un enlace sin completar no lleva a ningún lado: se marca en vez de quedar roto.
function linkTo(value, label, { className = '', href = value } = {}) {
  if (isPlaceholder(value)) {
    return el('span', { class: `${className} is-placeholder`, title: t('placeholder_title') }, `[EDITAR] ${label}`);
  }
  return el('a', { class: className, href, target: '_blank', rel: 'noopener' }, label);
}

function renderCore() {
  $('#coreLink').href = LINKS.cleargrade;
  $('#projects').append(...projects.map((project) => el('li', { class: 'card' },
    el('h4', {}, loc(project.name)),
    el('span', { class: 'card-status' }, loc(project.status)),
    el('p', {}, loc(project.description)),
    ...project.links.map((link) => el('a', { href: link.href }, loc(link.label))),
  )));
}

function renderSetup() {
  $('#setupGrid').append(...setup.map((group) => el('article', { class: 'setup-card' },
    el('h3', {}, loc(group.title)),
    el('dl', {}, ...group.specs.map(([label, value]) => el('div', {}, el('dt', {}, loc(label)), el('dd', {}, loc(value))))),
  )));
  $('#stackChips').append(...stack.map((item) => el('li', {}, item)));
}

function postBlock(block) {
  if (typeof block === 'string' || block.es) return el('p', {}, loc(block));
  if (block.h) return el('h4', { class: 'post-h' }, loc(block.h));
  if (block.quote) return el('blockquote', {}, loc(block.quote));
  if (block.code) return el('pre', { class: 'post-code' }, el('code', {}, block.code));
  if (block.list) return el('ul', { class: 'post-list' }, ...block.list.map((entry) => el('li', {}, loc(entry))));
  if (block.link) return el('p', {}, el('a', { href: block.link, target: '_blank', rel: 'noopener' }, `${loc(block.label ?? block.link)} ->`));
  const figure = (media) => {
    const node = el('figure', { class: 'post-figure' }, media);
    if (block.caption) node.append(el('figcaption', {}, loc(block.caption)));
    return node;
  };
  if (block.img) return figure(el('img', { src: block.img, alt: loc(block.alt ?? ''), loading: 'lazy', decoding: 'async' }));
  if (block.model) {
    const canvas = el('canvas', { class: 'post-model', 'aria-hidden': 'true' });
    queueMicrotask(() => mountModel(canvas, block.model));
    return figure(canvas);
  }
  if (block.spotify) {
    const id = block.spotify.match(/track\/(\w+)/)?.[1];
    return figure(el('iframe', { class: 'post-embed post-embed-audio', src: `https://open.spotify.com/embed/track/${id}`, title: 'Spotify', loading: 'lazy', allow: 'encrypted-media' }));
  }
  if (block.youtube) return figure(el('iframe', { class: 'post-embed', src: `https://www.youtube-nocookie.com/embed/${block.youtube}`, title: 'YouTube', loading: 'lazy', allow: 'encrypted-media; picture-in-picture', allowfullscreen: '' }));
  return document.createTextNode('');
}

function renderBlog() {
  $('#posts').append(...posts.map((post) => {
    const meta = el('span', { class: 'post-meta' }, el('time', { datetime: post.date }, post.date), ` · ${loc(post.tag)}`);
    if (post.featured) meta.append(el('span', { class: 'badge' }, t('blog_featured')));
    const share = el('button', { class: 'post-share', type: 'button' }, t('blog_copy'));
    share.addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}#post-${post.slug}`;
      try {
        await navigator.clipboard.writeText(url);
        share.textContent = t('blog_copied');
      } catch {
        location.hash = `post-${post.slug}`;
      }
      setTimeout(() => { share.textContent = t('blog_copy'); }, 1600);
    });
    const details = el('details', { class: `post${post.featured ? ' featured' : ''}`, id: `post-${post.slug}`, 'data-tag': loc(post.tag) },
      el('summary', {}, meta, el('span', { class: 'post-title' }, loc(post.title))),
      el('div', { class: 'post-body' }, ...post.body.map(postBlock), share),
    );
    details.open = post.featured;
    return details;
  }));

  const tags = [...new Set(posts.map((post) => loc(post.tag)))];
  const filters = el('div', { class: 'post-filters', role: 'group', 'aria-label': t('blog_filter') },
    ...[null, ...tags].map((tag) => {
      const button = el('button', { type: 'button', 'aria-pressed': String(tag === null) }, tag ?? t('blog_all'));
      button.addEventListener('click', () => {
        for (const other of button.parentElement.children) other.setAttribute('aria-pressed', String(other === button));
        for (const node of document.querySelectorAll('.post')) node.hidden = tag !== null && node.dataset.tag !== tag;
      });
      return button;
    }));
  $('#posts').before(filters);

  // Abre la entrada cuando se llega por su enlace (#post-…).
  const openFromHash = () => {
    const target = location.hash.startsWith('#post-') && document.getElementById(location.hash.slice(1));
    if (target) { target.open = true; target.scrollIntoView(); }
  };
  addEventListener('hashchange', openFromHash);
  openFromHash();
}

function renderRecs() {
  const row = (group) => (item) => {
    const cover = el('div', { class: 'rec-cover', 'data-group': group, 'data-alt': `${t('recs_cover')} ${loc(item.title)}` },
      el('span', { 'aria-hidden': 'true' }, `[${loc(item.title)[0]}]`));
    cover.item = item;
    const head = el('div', { class: 'rec-head' }, el('strong', {}, loc(item.title)));
    if (item.playing) head.append(el('span', { class: 'eq', 'aria-hidden': 'true' }, el('i'), el('i'), el('i'), el('i')));
    const info = el('div', { class: 'rec-info' }, head);
    if (item.by) info.append(el('span', { class: 'rec-by' }, loc(item.by)));
    if (item.note) info.append(el('p', {}, loc(item.note)));
    if (item.href) info.append(el('a', { href: item.href, target: '_blank', rel: 'noopener' }, `${loc(item.cta)} ->`));
    return el('li', { class: 'rec rec-with-cover' }, cover, info);
  };
  $('#recs').append(...recs.map((group) => el('article', { class: 'rec-box' },
    el('h3', {}, loc(group.title)),
    el('ul', {}, ...(group.items.length
      ? group.items.map(row(group.id))
      : [el('li', { class: 'rec' }, el('span', { class: 'is-placeholder rec-empty', title: t('recs_empty') }, `[EDITAR] ${t('recs_empty')}`))])),
  )));
  $('#recs').append(el('canvas', { class: 'glass glass-art', 'data-scene': 'flower', 'aria-hidden': 'true' }));
}

function renderLinks() {
  const rows = [
    [t('contact_email'), linkTo(LINKS.email, LINKS.email.replace('[EDITAR]', t('contact_email')), { href: `mailto:${LINKS.email}` })],
    [t('contact_github'), linkTo(LINKS.github, isPlaceholder(LINKS.github) ? t('contact_github') : LINKS.github.replace('https://github.com/', ''))],
    [t('contact_discord'), isPlaceholder(LINKS.discordUser)
      ? linkTo(LINKS.discordUser, t('contact_discord'))
      : el('b', {}, LINKS.discordUser)],
  ];
  $('#contactList').append(...rows.map(([label, value]) => el('li', {}, el('span', {}, label), value)));
}

function initForm() {
  const status = $('#formStatus');
  $('#contactForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.reportValidity()) return;
    if (isPlaceholder(LINKS.email)) {
      status.textContent = t('form_missing');
      status.classList.add('error');
      return;
    }
    const name = form.elements.name.value.trim();
    const subject = encodeURIComponent(`${t('form_subject')} ${name}`);
    const body = encodeURIComponent(form.elements.message.value);
    location.href = `mailto:${LINKS.email}?subject=${subject}&body=${body}`;
  });
}

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

function initNavSpy() {
  const links = new Map([...document.querySelectorAll('.nav a')].map((link) => [link.getAttribute('href').slice(1), link]));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const [id, link] of links) {
        const active = id === entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const id of links.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

applyI18n();
renderCore();
renderSetup();
renderRecs();
renderBlog();
renderLinks();
initForm();
initThemeToggle();
initNavSpy();
initDotMatrix($('#dotmatrix'));
initOrb($('#orb'));
initFlowers($('#flowers'));
initPortals($('[data-flower="gun"]'));
initDecode();
initReveal();
initGlass();
initCovers();
initMacSaver($('#macSaver'));
$('#year').textContent = String(new Date().getFullYear());
