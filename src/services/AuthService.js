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

        if (res.ok) {
            const data = await res.json();
            console.log(data)
            console.log(data.userID)
            this.userId = data.userID;
            console.log(this.userID)
            return true;
        }
        return false
    }

    getUserId() {
        return this.userId;
    }

    getCsrfToken(name = 'CSRF_token') {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1] || null;
    }

    async logout() {
        const res = await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });

        if (!res.ok) {
            console.error(`Ошибка разлогина: ${res.status}`);
            return false;
        }
        this.userId = null;
        this.isLoggedIn = false;

        console.log('Пользователь разлогинен');
        return true;
    }
}

export const authService = new AuthService();
