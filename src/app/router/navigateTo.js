import { routerInstance } from './routerInstance.js';

export function navigateTo(url) {
  history.pushState(null, null, url);
  if (routerInstance.current) {
    routerInstance.current.handleRoute();
  }
}
