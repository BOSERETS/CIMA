/* ============================================================
   Service Worker — Registre de présences
   Cache-first, chemins RELATIFS (robuste quel que soit le nom du dépôt).
   À CHAQUE déploiement : incrémenter CACHE_VERSION ci-dessous.
   ============================================================ */

var CACHE_VERSION = 'registre-v3';

/* Chemins relatifs au scope du SW (= dossier où il est servi).
   On met en cache la racine ET index.html : sur GitHub Pages, l'URL
   peut être demandée sous les deux formes (./ et ./index.html). */
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  /* Ne gérer que les GET de même origine */
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(resp) {
        /* Met en cache les ressources de même origine récupérées en ligne */
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var clone = resp.clone();
          caches.open(CACHE_VERSION).then(function(cache) { cache.put(event.request, clone); });
        }
        return resp;
      }).catch(function() {
        /* hors-ligne et non en cache : pour une navigation, retomber sur index.html */
        if (event.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
