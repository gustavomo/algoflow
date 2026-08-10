self.addEventListener('push', (event) => {
  const payload = event.data?.json() || {
    title: 'AlgoFlow review is ready',
    body: 'A concept is due for review.',
    url: '/review',
    tag: 'algoflow-review',
  };
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: { url: payload.url || '/review' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(
    event.notification.data?.url || '/review',
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const existing = clients.find((client) => client.url === target);
        return existing ? existing.focus() : self.clients.openWindow(target);
      }),
  );
});
