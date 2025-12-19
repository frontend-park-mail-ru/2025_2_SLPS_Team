import './helpers/svgHelper'
import { App } from './app/App';
import { navigateTo } from './app/router/navigateTo';
import { initTheme } from './helpers/InitTheme';

initTheme();

const root = document.getElementById('root');

if (!root) {
  throw new Error('[index] Root element #root not found');
}

const app = new App(root);
app.render();

export { navigateTo };
