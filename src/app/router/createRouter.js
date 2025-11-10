import { routerInstance } from './routerInstance.js';
import { matchDynamicRoute } from './matchDynamicRoute.js';

export function createRouter({ routes, root, authService }) {
  async function handleRoute() {
    const path = window.location.pathname;
    let route = null;
    let params = {};

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
      console.warn("Route not found:", path);
      return;
    }

    const access = route.access;
    const loggedIn = await authService.checkAuth();

    if (access === "guest-only" && loggedIn) {
      history.pushState(null, null, "/");
      return handleRoute();
    }
    if (access === "auth-only" && !loggedIn) {
      history.pushState(null, null, "/register");
      return handleRoute();
    }

    document.title = route.title;

    await route.renderFunc(params);
  }

  const router = {
    handleRoute,
  };

  routerInstance.current = router;

  return router;
}
