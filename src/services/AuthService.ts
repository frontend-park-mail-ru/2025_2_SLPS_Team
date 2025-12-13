type IsLoggedInResponse = {
  userID?: number;
};

type CsrfCookieName = 'CSRF_token' | (string & {});

export class AuthService {
  private static instance: AuthService | null = null;

  private userId: number | null = null;
  private isLoggedIn = false;

  private checkAuthPromise: Promise<boolean> | null = null;

  constructor() {
    if (AuthService.instance) return AuthService.instance;

    const cachedUserId = localStorage.getItem('userId');
    const cachedLogged = localStorage.getItem('isLoggedIn') === 'true';

    if (cachedLogged && cachedUserId) {
      const parsed = Number(cachedUserId);
      if (Number.isFinite(parsed)) {
        this.userId = parsed;
        this.isLoggedIn = true;
      }
    }

    AuthService.instance = this;
  }

  async checkAuth(): Promise<boolean> {
    if (this.checkAuthPromise) return this.checkAuthPromise;

    this.checkAuthPromise = (async () => {
      try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/auth/isloggedin`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Not authorized');

        const data = (await res.json()) as IsLoggedInResponse;

        const id = typeof data.userID === 'number' && Number.isFinite(data.userID) ? data.userID : null;
        if (!id) throw new Error('Invalid userID');

        this.userId = id;
        this.isLoggedIn = true;

        localStorage.setItem('userId', String(id));
        localStorage.setItem('isLoggedIn', 'true');

        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('[Auth] Network/auth error:', message);

        const cachedLogged = localStorage.getItem('isLoggedIn') === 'true';
        const cachedUserId = localStorage.getItem('userId');

        if (cachedLogged && cachedUserId) {
          const parsed = Number(cachedUserId);
          if (Number.isFinite(parsed)) {
            this.userId = parsed;
            this.isLoggedIn = true;
            return true;
          }
        }

        this.userId = null;
        this.isLoggedIn = false;
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
    const value =
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')[1] ?? null;

    return value;
  }

  async logout(): Promise<boolean> {
    try {
      const csrf = this.getCsrfToken('CSRF_token');

      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (csrf) headers['X-CSRF-Token'] = csrf;

      const res = await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (!res.ok) {
        console.error(`Logout error: ${res.status}`);
        return false;
      }
    } catch {
    }

    this.userId = null;
    this.isLoggedIn = false;

    localStorage.removeItem('userId');
    localStorage.removeItem('isLoggedIn');

    return true;
  }
}

export const authService = new AuthService();
