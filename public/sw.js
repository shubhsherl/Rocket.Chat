const HTMLToCache = '/';
const version = 'viasat-0.1';

function removeHash(element) {
	if (typeof element === 'string') { return element.split('?hash=')[0]; }
}

function hasHash(element) {
	if (typeof element === 'string') { return /\?hash=.*/.test(element); }
}

function hasSameHash(firstUrl, secondUrl) {
	if (typeof firstUrl === 'string' && typeof secondUrl === 'string') {
		return /\?hash=(.*)/.exec(firstUrl)[1] === /\?hash=(.*)/.exec(secondUrl)[1];
	}
}

function handleAvatar(request, response) {
	const clonedResponse = response.clone();
	const url = request.url.split('?')[0];
	caches.open(version).then((cache) => cache.put(new Request(url), clonedResponse));
}

const fetchFromNetwork = (event) => {
	const requestToFetch = event.request.clone();
	return fetch(requestToFetch, { cache: 'reload' }).then((response) => {
		const clonedResponse = response.clone();
		const contentType = clonedResponse.headers.get('content-type');

		if (!clonedResponse || clonedResponse.status !== 200 || clonedResponse.type !== 'basic'
			|| /\/sockjs\//.test(event.request.url)) {
			return response;
		}

		if (/html/.test(contentType)) {
			caches.open(version).then((cache) => cache.put(HTMLToCache, clonedResponse));
		} else {
			// Delete old version of a file
			if (hasHash(event.request.url)) {
				caches.open(version).then((cache) => cache.keys().then((keys) => keys.forEach((asset) => {
					if (new RegExp(removeHash(event.request.url)).test(removeHash(asset.url))) {
						cache.delete(asset);
					}
				})));
			}

			if (/avatar\/.*\?_dc/.test(event.request.url)) {
				// handle the avatar updates
				handleAvatar(event.request, response);
			}

			caches.open(version).then((cache) => cache.put(event.request, clonedResponse));
		}
		return response;
	}).catch(() => {
		if (hasHash(event.request.url)) { return caches.match(event.request.url); }
		// If the request URL hasn't been served from cache and isn't sockjs we suppose it's HTML
		if (!/\/sockjs\//.test(event.request.url)) { return caches.match(HTMLToCache); }
		// Only for sockjs
		return new Response('No connection to the server', {
			status: 503,
			statusText: 'No connection to the server',
			headers: new Headers({ 'Content-Type': 'text/plain' }),
		});
	});
};

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(version).then((cache) => {
		cache.add(HTMLToCache).then(self.skipWaiting());
	}));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(
			(cacheNames) => Promise.all(cacheNames.map(
				(cacheName) => {
					let res;
					if (version !== cacheName) {
						res = caches.delete(cacheName);
					}
					return res;
				},
			)),
		).then(self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method === 'POST') {
		return;
	}

	event.respondWith(
		caches.match(event.request.clone()).then((cached) => {
			// We don't return cached HTML (except if fetch failed)
			if (cached) {
				const resourceType = cached.headers.get('content-type');
				// We only return non css/js/html cached response e.g images
				if (!hasHash(event.request.url) && !/text\/html/.test(resourceType)) {
					// Refresh resources which are not(sound or assets)
					if (!/sounds/.test(event.request.url) && !/assets/.test(event.request.url) && !/font/.test(event.request.url)) {
						fetchFromNetwork(event);
					}
					return cached;
				}

				// If the CSS/JS didn't change since it's been cached, return the cached version
				if (hasHash(event.request.url) && hasSameHash(event.request.url, cached.url)) {
					return cached;
				}
			}
			return fetchFromNetwork(event);
		}),
	);
});
