// Service Worker simples para desenvolvimento
const CACHE_NAME = 'ventushub-dev-v1';

// Instalar e ativar imediatamente
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// Estratégia simples: sempre buscar da rede primeiro
self.addEventListener('fetch', (event) => {
  // Para navegação (HTML), sempre usar rede para evitar tela branca
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Se falhar, retorna uma resposta básica
          return new Response(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>VentusHub - Carregando...</title>
                <style>
                  body { font-family: system-ui; padding: 20px; text-align: center; }
                  .loading { margin-top: 50vh; transform: translateY(-50%); }
                </style>
              </head>
              <body>
                <div class="loading">
                  <h2>VentusHub</h2>
                  <p>Conectando...</p>
                  <button onclick="location.reload()">Tentar novamente</button>
                </div>
              </body>
            </html>
          `, { 
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Para outros recursos, deixar passar normalmente
  event.respondWith(fetch(event.request));
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: data.url,
    actions: [
      {
        action: 'open',
        title: 'Abrir'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data || '/')
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Implementar sincronização de dados offline
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  // Implementar lógica de sincronização
  console.log('[SW] Background sync triggered');
}