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
  let url = request.url;
  let isGETRequest = request.method === 'GET';
  let isHTMLRequest = request.headers.get('accept').indexOf('text/html') !== -1;
  let isLocal = new URL(url).origin === location.origin;

  // Check if the path we are visiting is in the prember routes with or without trailing slash
  const withSlash = url.endsWith('/') ? url : `${url}/`;
  const withoutSlash = url.endsWith('/') ? url.slice(0, -1) : url;
  const isPremberURL =
    PREMBER_URLS.indexOf(new URL(withSlash).pathname) !== -1 ||
    PREMBER_URLS.indexOf(new URL(withoutSlash).pathname) !== -1;

  if (isGETRequest && isHTMLRequest && isLocal && isPremberURL) {
    event.respondWith(
      caches.match(url, { cacheName: CACHE_NAME }).then((cached) => {
        return cached || fetch(event.request)
          .then((response) => {
            if (!response.redirected) {
              const cacheCopy = response.clone();

              caches.open(CACHE_NAME)
                .then(function add(cache) {
                  cache.put(url, cacheCopy);
                });
            }

            return response;
          });
      })
    );
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupCaches(CACHE_KEY_PREFIX, CACHE_NAME));
});
