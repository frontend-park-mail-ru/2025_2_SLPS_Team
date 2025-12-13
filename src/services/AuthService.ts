type IsLoggedInResponse = { userID?: number };
type CsrfCookieName = 'CSRF_token' | (string & {});

const AUTH_SINGLETON_KEY = '__AUTH_SERVICE_SINGLETON__';
const AUTH_ENDPOINT_BROKEN_KEY = '__AUTH_ISLOGGEDIN_BROKEN__';

function getGlobalFlag(): boolean {
  return Boolean((globalThis as any)[AUTH_ENDPOINT_BROKEN_KEY]);
}

function setGlobalFlag(v: boolean): void {
  (globalThis as any)[AUTH_ENDPOINT_BROKEN_KEY] = v;
}

export class AuthService {
  private userId: number | null = null;
  private isLoggedIn = false;

  private checkAuthPromise: Promise<boolean> | null = null;
  private lastAuthResult: boolean | null = null;
  private lastAuthAt = 0;

  private readonly authTtlMs = 15_000;
  private readonly failTtlMs = 60_000;

  private logoutPromise: Promise<boolean> | null = null;
  private lastLogoutAt = 0;
  private readonly logoutTtlMs = 10_000;

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
    if (getGlobalFlag()) {
      this.clearAuth();
      return false;
    }

    const now = Date.now();

    if (this.lastAuthResult === false && now - this.lastAuthAt < this.failTtlMs) {
      return false;
    }

    if (!force && this.lastAuthResult !== null && now - this.lastAuthAt < this.authTtlMs) {
      return this.lastAuthResult;
    }

    if (this.checkAuthPromise) return this.checkAuthPromise;

    this.checkAuthPromise = (async () => {
      try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/auth/isloggedin`, {
          method: 'GET',
          credentials: 'include',
        });

        if (res.status === 404) {
          setGlobalFlag(true);
          this.clearAuth();
          return false;
        }

        if (!res.ok) {
          this.clearAuth();
          return false;
        }

        const data = (await res.json()) as IsLoggedInResponse;
        const id = typeof data.userID === 'number' && Number.isFinite(data.userID) ? data.userID : null;

        if (!id) {
          this.clearAuth();
          return false;
        }

        this.userId = id;
        this.isLoggedIn = true;

        localStorage.setItem('userId', String(id));
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
    const now = Date.now();

    if (this.logoutPromise) return this.logoutPromise;
    if (now - this.lastLogoutAt < this.logoutTtlMs) return false;

    this.lastLogoutAt = now;

    this.logoutPromise = (async () => {
      try {
        const csrf = this.getCsrfToken('CSRF_token');
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (csrf) headers['X-CSRF-Token'] = csrf;

        const res = await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers,
        });

      } catch {
      } finally {
        this.clearAuth();
        this.logoutPromise = null;
      }

      return true;
    })();

    return this.logoutPromise;
  }
}

export const authService: AuthService =
  (globalThis as any)[AUTH_SINGLETON_KEY] ??
  ((globalThis as any)[AUTH_SINGLETON_KEY] = new AuthService());
