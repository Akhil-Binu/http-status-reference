(function () {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {
        /* offline support is a progressive enhancement; ignore failures */
      });
    });
  }

  var banner = document.getElementById('offline-banner');
  if (!banner) return;

  function updateOnlineStatus() {
    banner.classList.toggle('is-visible', !navigator.onLine);
  }

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
})();
