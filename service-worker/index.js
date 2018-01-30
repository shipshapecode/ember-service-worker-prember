
import {
  URLS,
  VERSION
} from 'ember-service-worker-prember/service-worker/config';

import { urlMatchesAnyPattern } from 'ember-service-worker/service-worker/url-utils';
import cleanupCaches from 'ember-service-worker/service-worker/cleanup-caches';

const CACHE_KEY_PREFIX = 'esw-prember';
const CACHE_NAME = `${CACHE_KEY_PREFIX}-${VERSION}`;

URLS.forEach((url) => {
  const INDEX_HTML_URL = new URL(url, self.location).toString();

  self.addEventListener('install', (event) => {
    event.waitUntil(
      fetch(INDEX_HTML_URL, { credentials: 'include' }).then((response) => {
        return caches
          .open(CACHE_NAME)
          .then((cache) => cache.put(INDEX_HTML_URL, response));
      })
    );
  });

  self.addEventListener('fetch', (event) => {
    let request = event.request;
    let isGETRequest = request.method === 'GET';
    let isHTMLRequest = request.headers.get('accept').indexOf('text/html') !== -1;
    let isLocal = new URL(request.url).origin === location.origin;

    if (isGETRequest && isHTMLRequest && isLocal) {
      event.respondWith(
        caches.match(INDEX_HTML_URL, { cacheName: CACHE_NAME })
      );
    }
  });
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupCaches(CACHE_KEY_PREFIX, CACHE_NAME));
});
