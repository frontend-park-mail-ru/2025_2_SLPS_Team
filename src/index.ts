import { App } from './app/App';
import { navigateTo } from './app/router/navigateTo';

const root = document.getElementById('root');

if (!root) {
  throw new Error('[index] Root element #root not found');
}

const app = new App(root);
app.render();

export { navigateTo };

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg: ServiceWorkerRegistration) => {
        console.log('[SW] registered:', reg.scope);
      })
      .catch((err: unknown) => {
        console.error('[SW] registration failed:', err);
      });
  });
}
