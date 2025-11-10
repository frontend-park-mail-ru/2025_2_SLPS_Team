export function matchDynamicRoute(routePath, urlPath) {
  const routeParts = routePath.split('/').filter(Boolean);
  const urlParts = urlPath.split('/').filter(Boolean);

  if (routeParts.length !== urlParts.length) return null;

  const params = {};
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].slice(1);
      params[paramName] = urlParts[i];
    } else if (routeParts[i] !== urlParts[i]) {
      return null;
    }
  }

  return { params };
}
