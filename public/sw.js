// Service Worker para push notifications
self.addEventListener('push', function(event) {
  console.log('Push received:', event);
  
  if (!event.data) {
    console.log('Push event without data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error('Error parsing notification data:', error);
    notificationData = {
      title: 'Nova Notificação',
      body: event.data.text() || 'Você tem uma nova notificação!'
    };
  }

  const { title, body, icon, badge, data, actions } = notificationData;

  const options = {
    body: body || 'Você tem uma nova notificação!',
    icon: icon || '/favicon.ico',
    badge: badge || '/favicon.ico',
    data: data || {},
    actions: actions || [],
    requireInteraction: true,
    vibrate: [200, 100, 200],
    tag: data?.type || 'default'
  };

  event.waitUntil(
    self.registration.showNotification(title || 'Nova Notificação', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const { data } = event.notification;
  
  // Determinar a URL para abrir baseada no tipo da notificação
  let targetUrl = '/';
  
  if (data?.type === 'order_update' && data?.order_id) {
    targetUrl = `/order/${data.order_id}`;
  } else if (data?.type === 'promotion') {
    targetUrl = '/';
  }

  // Abrir ou focar na janela
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      // Verificar se já existe uma janela aberta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Se não existe, abrir nova janela
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
});

// Instalar o service worker
self.addEventListener('install', function(event) {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});