let hadPreviousServiceWorker = false;

self.addEventListener('install', () => {
  hadPreviousServiceWorker = Boolean(self.registration.active);
});

self.addEventListener('activate', (event) => {
  if (!hadPreviousServiceWorker) return;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.all(windows.map((client) => client.navigate(client.url)));
  })());
});
