type IsLoggedInResponse = {
  userID?: number;
};

type CsrfCookieName = 'CSRF_token' | (string & {});

const AUTH_SINGLETON_KEY = '__AUTH_SERVICE_SINGLETON__';
const AUTH_GUARD_KEY = '__AUTH_CHECK_GUARD__';

type GuardState = {
  broken: boolean;
  inFlight: Promise<boolean> | null;
  lastAt: number;
  lastResult: boolean | null;
};

function getGuard(): GuardState {
  const g = (globalThis as unknown as Record<string, unknown>)[AUTH_GUARD_KEY] as GuardState | undefined;
  if (g) return g;

  const init: GuardState = { broken: false, inFlight: null, lastAt: 0, lastResult: null };
  (globalThis as unknown as Record<string, unknown>)[AUTH_GUARD_KEY] = init;
  return init;
}

export class AuthService {
  private userId: number | null = null;
  private isLoggedIn = false;

  private readonly authTtlMs = 15_000;
  private readonly minIntervalMs = 2_000;

  constructor() {
    const cachedUserId = localStorage.getItem('userId');
    const cachedLogged = localStorage.getItem('isLoggedIn') === 'true';

    if (cachedLogged && cachedUserId) {
      const parsed = Number(cachedUserId);
      if (Number.isFinite(parsed)) {
        this.userId = parsed;
        this.isLoggedIn = true;

        const guard = getGuard();
        guard.lastResult = true;
        guard.lastAt = Date.now();
      }
    }
  }

  private clearAuth(): void {
    this.userId = null;
    this.isLoggedIn = false;

    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');

    const guard = getGuard();
    guard.lastResult = false;
    guard.lastAt = Date.now();
  }

  async checkAuth(force = false): Promise<boolean> {
    const guard = getGuard();
    const now = Date.now();

    if (guard.broken) {
      this.clearAuth();
      return false;
    }

    if (guard.inFlight) return guard.inFlight;

    if (now - guard.lastAt < this.minIntervalMs && guard.lastResult !== null) {
      return guard.lastResult;
    }

    if (!force && guard.lastResult !== null && now - guard.lastAt < this.authTtlMs) {
      return guard.lastResult;
    }

    guard.inFlight = (async () => {
      try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/auth/isloggedin`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.status === 404) {
          guard.broken = true;
          this.clearAuth();
          guard.lastResult = false;
          guard.lastAt = Date.now();
          return false;
        }

        if (!res.ok) {
          this.clearAuth();
          guard.lastResult = false;
          guard.lastAt = Date.now();
          return false;
        }

        const data = (await res.json()) as IsLoggedInResponse;
        const id = typeof data.userID === 'number' && Number.isFinite(data.userID) ? data.userID : null;

        if (!id) {
          this.clearAuth();
          guard.lastResult = false;
          guard.lastAt = Date.now();
          return false;
        }

        this.userId = id;
        this.isLoggedIn = true;

        localStorage.setItem('userId', String(id));
        localStorage.setItem('isLoggedIn', 'true');

        guard.lastResult = true;
        guard.lastAt = Date.now();
        return true;
      } catch {
        this.clearAuth();
        guard.lastResult = false;
        guard.lastAt = Date.now();
        return false;
      } finally {
        guard.inFlight = null;
      }
    })();

    return guard.inFlight;
  }

  getUserId(): number | null {
    return this.userId;
  }

  getIsLoggedIn(): boolean {
    return this.isLoggedIn;
  }

  getCsrfToken(name: CsrfCookieName = 'CSRF_token'): string | null {
    return (
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1] ?? null
    );
  }

  async logout(): Promise<boolean> {
    try {
      const csrf = this.getCsrfToken('CSRF_token');
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (csrf) headers['X-CSRF-Token'] = csrf;

      await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
    } catch {
      // ignore
    }

    this.clearAuth();
    return true;
  }
}

export const authService: AuthService =
  (globalThis as any)[AUTH_SINGLETON_KEY] ??
  ((globalThis as any)[AUTH_SINGLETON_KEY] = new AuthService());
