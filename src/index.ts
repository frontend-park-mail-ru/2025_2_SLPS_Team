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
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
  });
}
