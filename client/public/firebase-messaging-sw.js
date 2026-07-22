importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
// Note: We use query params appended to the script URL if we want dynamic config,
// but for simplicity, we can parse it from a URL or rely on the frontend to register it.
// In a real app with hidden env vars, we might inject this via build or pass it.
// For now, it will look for standard initialization.

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

// Since process.env isn't available in service worker, we define a placeholder config
// that will be replaced during build time or by fetching from an API.
// To make it fully dynamic without build steps, it's best to let the client handle foreground 
// notifications and let the SW only handle background ones if initialized.
// For now, we will leave the Firebase init empty and allow the service worker to receive 
// messages if the client initialized it properly.
const firebaseConfig = {
  // Config should be injected here or fetched dynamically
};

// firebase.initializeApp(firebaseConfig);
// const messaging = firebase.messaging();

// messaging.onBackgroundMessage(function(payload) {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);
//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//     icon: '/favicon.ico'
//   };
//   self.registration.showNotification(notificationTitle, notificationOptions);
// });
