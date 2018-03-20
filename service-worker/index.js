import {
  ENVIRONMENT,
  HTML_MAPPING
} from 'ember-service-worker-prember/service-worker/config';

/**
 * Fetch the html and cache it
 * @param {request} request
 * @param {string} cacheName The string that represents the hashed html content
 * @returns {Promise<Response>}
 */
function fetchAndCache(request, cacheName) {
  return fetch(request)
    .then((response) => {
      if (cacheName && !response.redirected) {
        return caches.open(cacheName)
          .then((cache) => {
            return cache.put(request, response.clone());
          })
          .then(() => {
            return response;
          });
      }

      return response;
    });
}

/**
 * Retrieve the html from the cache or call fetchAndCache to get the html and cache it
 * @param {request} request
 * @returns {Promise<Response>}
 */
function getHtmlFile(request) {
  let url = new URL(request.url).pathname;
  url = url.endsWith('/') ? url : `${url}/`;
  const cacheName = HTML_MAPPING[url];
  return caches.open(cacheName)
    .then((cache) => {
      return cache.match(url);
    })
    .then((response) => {
      return response ? response : fetchAndCache(request, cacheName);
    });
}

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
 * Make sure we are not in development mode and went to '/tests'
 * @param {string} url The request.url string
 * @returns {boolean} True if env is development and we went to '/tests'
 */
function isTests(url) {
  return new URL(url).pathname === '/tests' && ENVIRONMENT === 'development';
}


/**
 * Cleanup old cached content
 */
self.addEventListener('activate', event => {
  const EXPECTED_CACHES = Object.values(HTML_MAPPING);
  event.waitUntil(caches.keys().then(cacheNames => {
    const outdatedCaches = cacheNames
      .filter((cacheName) => {
        return cacheName.startsWith('esw-prember') && !EXPECTED_CACHES.includes(cacheName);
      });
    return Promise.all(outdatedCaches.map(cacheName => caches.delete(cacheName)));

  }).then(() => self.clients.claim()));
});

/**
 * Fetch the page and only cache the static HTML
 */
self.addEventListener('fetch', (event) => {
  let request = event.request;
  let url = request.url;

  if (isLocalHTMLGETRequest(request, url) && !isTests(url)) {
    event.respondWith(
      getHtmlFile(request)
      // TODO implement fallback here
      // .catch(() => getFallbackPage(request))
    );
  }
});
