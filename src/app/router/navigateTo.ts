import { routerInstance } from './routerInstance';

export function navigateTo(url: string): void {
  history.pushState(null, '', url);
  routerInstance.current?.handleRoute();
}
