
(() => {
  if (self.SW_CONSTANTS) return;

  const VERSION = 'v2';

  self.SW_CONSTANTS = {
    VERSION,
    STATIC_CACHE: `static-${VERSION}`,
    PAGES_CACHE: `pages-${VERSION}`,
    API_CACHE: `api-${VERSION}`,
    PRECACHE_URLS: [
      '/',
      '/index.html',
      '/bundle.js',
      '/styles/main.css',
      '/public/globalImages/Logo.svg',
    ],
  };
})();
