// Disable navigation preload to avoid warnings
self.addEventListener('activate', event => {
  event.waitUntil(
    self.registration.navigationPreload.disable()
  );
});

// Basic fetch handler (optional, for caching if needed)
self.addEventListener('fetch', event => {
  // Add caching logic here if desired
  // For now, just pass through
  event.respondWith(fetch(event.request));
});