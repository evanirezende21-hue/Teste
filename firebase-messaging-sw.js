importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "COLE_SUA_API_KEY_AQUI",
  authDomain: "moto-taxi-sjn-d9b71.firebaseapp.com",
  databaseURL: "https://moto-taxi-sjn-d9b71-default-rtdb.firebaseio.com",
  projectId: "moto-taxi-sjn-d9b71",
  storageBucket: "moto-taxi-sjn-d9b71.appspot.com",
  messagingSenderId: "13246123116",
  appId: "COLE_SEU_APP_ID_AQUI"
});

const messaging = firebase.messaging();

// Notificação recebida em segundo plano / tela bloqueada
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title || "Nova Corrida!";
  const notificationOptions = {
    body: payload.notification.body || "Você recebeu uma nova solicitação de corrida.",
    icon: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'nova-corrida'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
