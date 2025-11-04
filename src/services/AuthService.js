class AuthService {
    static instance = null;

    constructor() {
        if (AuthService.instance) {
            return AuthService.instance;
        }

        this.userId = null;
        this.isLoggedIn = false;

        AuthService.instance = this;
    }

    async checkAuth() {
        const res = await fetch(`${process.env.API_BASE_URL}/api/auth/isloggedin`, {
            method: 'GET',
            credentials: 'include',
        });
        const data = await res.json();

        this.isLoggedIn = !!data.isloggedin;
        this.userId = data.userId || null;
        console.log(this.userId);
        return this.isLoggedIn;
    }

    getUserId() {
        return this.userId;
    }
}

export const authService = new AuthService();
