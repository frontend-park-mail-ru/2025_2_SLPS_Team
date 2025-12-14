export type SWConstants = {
  VERSION: string;
  STATIC_CACHE: string;
  PAGES_CACHE: string;
  API_CACHE: string;
  PRECACHE_URLS: string[];
};

export type SWGlobal = ServiceWorkerGlobalScope & {
  SW_CONSTANTS?: SWConstants;
};

export function initSwConstants(self: SWGlobal): SWConstants {
  if (self.SW_CONSTANTS) return self.SW_CONSTANTS;

  const VERSION = 'v3';

  const constants: SWConstants = {
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

  self.SW_CONSTANTS = constants;
  return constants;
}
