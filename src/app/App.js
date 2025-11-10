import { createRouter } from './router/createRouter.js';
import { routes } from './router/routes.js';
import { authService } from '../services/AuthService.js';
import '../index.css';

export class App {
  constructor(root) {
    this.root = root;
    this.router = createRouter({
      routes,
      root: this.root,
      authService,
    });
  }

  render() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .catch((err) => console.error('SW error:', err));
      });
    }

    this.router.handleRoute();

    window.addEventListener('popstate', () => {
      this.router.handleRoute();
    });
  }
}
