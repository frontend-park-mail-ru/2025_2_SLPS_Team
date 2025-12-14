import { createRouter } from './router/createRouter';
import { routes } from './router/routes';
import { authService } from '../services/AuthService';
import '../index.css';

export type Router = {
  handleRoute: () => Promise<void> | void;
};

export class App {
  private root: HTMLElement;
  private router: Router;

  constructor(root: HTMLElement) {
    this.root = root;
    this.router = createRouter({
      routes,
      root: this.root,
      authService,
    });
  }

  render(): void {
    this.router.handleRoute();

    window.addEventListener('popstate', () => {
      this.router.handleRoute();
    });
  }
}
