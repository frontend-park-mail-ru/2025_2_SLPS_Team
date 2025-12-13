type IsLoggedInResponse = {
  userID?: number;
};

type CsrfCookieName = 'CSRF_token' | (string & {});

export class AuthService {
  private userId: number | null = null;
  private isLoggedIn = false;

  private checkAuthPromise: Promise<boolean> | null = null;

  private lastAuthResult: boolean | null = null;
  private lastAuthAt = 0;

  private readonly authTtlMs = 15_000;

  // 🔥 ГЛАВНЫЙ ФЛАГ
  private isAuthEndpointBroken = false;

  constructor() {
    const cachedUserId = localStorage.getItem('userId');
    const cachedLogged = localStorage.getItem('isLoggedIn') === 'true';

    if (cachedLogged && cachedUserId) {
      const parsed = Number(cachedUserId);
      if (Number.isFinite(parsed)) {
        this.userId = parsed;
        this.isLoggedIn = true;
        this.lastAuthResult = true;
        this.lastAuthAt = Date.now();
      }
    }
  }

  private clearAuth(): void {
    this.userId = null;
    this.isLoggedIn = false;

    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');

    this.lastAuthResult = false;
    this.lastAuthAt = Date.now();
  }

  async checkAuth(force = false): Promise<boolean> {
    if (this.isAuthEndpointBroken) {
      return false;
    }

    const now = Date.now();

    if (!force && this.lastAuthResult !== null && now - this.lastAuthAt < this.authTtlMs) {
      return this.lastAuthResult;
    }

    if (this.checkAuthPromise) {
      return this.checkAuthPromise;
    }

    this.checkAuthPromise = (async () => {
      try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/auth/isloggedin`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.status === 404) {
          this.isAuthEndpointBroken = true;
          this.clearAuth();
          return false;
        }

        if (!res.ok) {
          this.clearAuth();
          return false;
        }

        const data = (await res.json()) as IsLoggedInResponse;

        if (typeof data.userID !== 'number' || !Number.isFinite(data.userID)) {
          this.clearAuth();
          return false;
        }

        this.userId = data.userID;
        this.isLoggedIn = true;

        localStorage.setItem('userId', String(data.userID));
        localStorage.setItem('isLoggedIn', 'true');

        this.lastAuthResult = true;
        this.lastAuthAt = Date.now();
        return true;
      } catch {
        this.clearAuth();
        return false;
      } finally {
        this.checkAuthPromise = null;
      }
    })();

    return this.checkAuthPromise;
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

      const res = await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (!res.ok) return false;
    } catch {
      return false;
    }

    this.clearAuth();
    return true;
  }
}

const AUTH_SINGLETON_KEY = '__AUTH_SERVICE_SINGLETON__';

export const authService: AuthService =
  (globalThis as any)[AUTH_SINGLETON_KEY] ??
  ((globalThis as any)[AUTH_SINGLETON_KEY] = new AuthService());
