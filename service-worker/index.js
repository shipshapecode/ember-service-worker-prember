import {
  PREMBER_URLS,
  VERSION
} from 'ember-service-worker-prember/service-worker/config';

import { urlMatchesAnyPattern } from 'ember-service-worker/service-worker/url-utils';
import cleanupCaches from 'ember-service-worker/service-worker/cleanup-caches';

const CACHE_KEY_PREFIX = 'esw-prember';
const CACHE_NAME = `${CACHE_KEY_PREFIX}-${VERSION}`;

/**
 * Check if this is a GET request, the type is HTML, and it is on our local origin.
 * @param request The request object
 * @param {string} url The request.url string
 * @returns {boolean} True if this is a GET request, the type is HTML, and on our origin
 */
function isLocalHTMLGETRequest(request, url) {
  let isGETRequest = request.method === 'GET';
  let isHTMLRequest = request.headers.get('accept').indexOf('text/html') !== -1;
  let isLocal = new URL(url).origin === location.origin;

  return isGETRequest && isHTMLRequest && isLocal;
}

/**
 * Check if the path we are visiting is in the prember routes with or without trailing slash
 * @param {string} url The url to check
 * @returns {boolean} Whether this is a prember url or not
 */
function isPremberURL(url) {
  const withSlash = url.endsWith('/') ? url : `${url}/`;
  const withoutSlash = url.endsWith('/') ? url.slice(0, -1) : url;
  return PREMBER_URLS.indexOf(new URL(withSlash).pathname) !== -1 ||
    PREMBER_URLS.indexOf(new URL(withoutSlash).pathname) !== -1;
}

/**
 * Cleanup old cached content
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(cleanupCaches(CACHE_KEY_PREFIX, CACHE_NAME));
});

/**
 * Fetch the page and only cache the static HTML
 */
self.addEventListener('fetch', (event) => {
  let request = event.request;
  let url = request.url;

  if (isLocalHTMLGETRequest(request, url) && isPremberURL(url)) {
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
