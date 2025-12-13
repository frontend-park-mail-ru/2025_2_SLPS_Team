export type RouteMatch = {
  params: Record<string, string>;
};

export function matchDynamicRoute(
  routePath: string,
  urlPath: string,
): RouteMatch | null {
  const routeParts = routePath.split('/').filter(Boolean);
  const urlParts = urlPath.split('/').filter(Boolean);

  if (routeParts.length !== urlParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < routeParts.length; i++) {
    const rp = routeParts[i]!;
    const up = urlParts[i]!;

    if (rp.startsWith(':')) {
      const paramName = rp.slice(1);
      params[paramName] = up;
    } else if (rp !== up) {
      return null;
    }
  }

  return { params };
}
