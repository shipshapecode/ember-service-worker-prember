import {
  PREMBER_URLS,
  VERSION
} from 'ember-service-worker-prember/service-worker/config';

import { urlMatchesAnyPattern } from 'ember-service-worker/service-worker/url-utils';
import cleanupCaches from 'ember-service-worker/service-worker/cleanup-caches';

const CACHE_KEY_PREFIX = 'esw-prember';
const CACHE_NAME = `${CACHE_KEY_PREFIX}-${VERSION}`;

self.addEventListener('fetch', (event) => {
  let request = event.request;
  let isGETRequest = request.method === 'GET';
  let isHTMLRequest = request.headers.get('accept').indexOf('text/html') !== -1;
  let isLocal = new URL(request.url).origin === location.origin;

  let url = request.url;
  // Add trailing slash for consistency
  if(!url.endsWith('/')) {
    url += '/';
  }
  // Check if the path we are visiting is in the prember routes
  const isPremberURL = PREMBER_URLS.indexOf(new URL(url).pathname) !== -1;

  if (isGETRequest && isHTMLRequest && isLocal && isPremberURL) {
    event.respondWith(
      caches.match(url, { cacheName: CACHE_NAME }).then((cached) => {
        return cached || fetch(event.request)
        .then((response) => {
          const cacheCopy = response.clone();

          caches.open(CACHE_NAME)
            .then(function add(cache) {
              cache.put(url, cacheCopy);
            });

          return response;
        });
      })
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupCaches(CACHE_KEY_PREFIX, CACHE_NAME));
});
