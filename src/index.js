import { App } from './app/App.js';
import { navigateTo } from './app/router/navigateTo.js';

const root = document.getElementById('root');
const app = new App(root);
app.render();

export { navigateTo };

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => console.log('Service Worker зарегистрирован'))
      .catch((err) => console.error('Ошибка регистрации SW:', err));
  });
}
