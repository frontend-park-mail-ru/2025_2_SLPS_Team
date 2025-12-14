import { routerInstance } from './routerInstance';
import { matchDynamicRoute } from './matchDynamicRoute';

export type RouteAccess = 'guest-only' | 'auth-only' | 'public';

export type RouteConfig = {
  title: string;
  access?: RouteAccess;
  renderFunc: (params: Record<string, string>) => Promise<void> | void;
};

export type RoutesMap = Record<string, RouteConfig>;

export type AuthServiceLike = {
  checkAuth: () => Promise<boolean>;
};

export type Router = {
  handleRoute: () => Promise<void>;
};

export function createRouter({
  routes,
  root,
  authService,
}: {
  routes: RoutesMap;
  root: HTMLElement;
  authService: AuthServiceLike;
}): Router {
  void root;

  async function handleRoute(): Promise<void> {
    const path = window.location.pathname;
    let route: RouteConfig | null = null;
    let params: Record<string, string> = {};

    for (const [routePath, routeConfig] of Object.entries(routes)) {
      if (routePath === path) {
        route = routeConfig;
        params = {};
        break;
      }

      const match = matchDynamicRoute(routePath, path);
      if (match) {
        route = routeConfig;
        params = match.params;
        break;
      }
    }

    if (!route) {
      console.warn('Route not found:', path);
      return;
    }

    const access: RouteAccess = route.access ?? 'public';
    const loggedIn = await authService.checkAuth();

    if (access === 'guest-only' && loggedIn) {
      history.pushState(null, '', '/');
      await handleRoute();
      return;
    }

    if (access === 'auth-only' && !loggedIn) {
      history.pushState(null, '', '/register');
      await handleRoute();
      return;
    }

    document.title = route.title;
    await route.renderFunc(params);
  }

  const router: Router = {
    handleRoute,
  };

  routerInstance.current = router;

  return router;
}
