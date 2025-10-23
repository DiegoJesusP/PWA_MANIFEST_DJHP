if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/PWA_MANIFEST_DJHP/sw.js')
      .then(() => console.log('[SW] Registrado correctamente'))
      .catch(err => console.error('[SW] Error al registrar:', err));
  });
}
