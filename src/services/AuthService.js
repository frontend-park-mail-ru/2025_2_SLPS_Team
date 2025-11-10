class AuthService {
  static instance = null;

  constructor() {
    if (AuthService.instance) {
      return AuthService.instance;
    }

    this.userId = null;
    this.isLoggedIn = false;

    const cachedUserId = localStorage.getItem("userId");
    const cachedLogged = localStorage.getItem("isLoggedIn") === "true";
    if (cachedLogged && cachedUserId) {
      this.userId = Number(cachedUserId);
      this.isLoggedIn = true;
      console.log("[Auth] Восстановлено офлайн-состояние:", this.userId);
    }

    AuthService.instance = this;
  }

  async checkAuth() {
    try {
      const res = await fetch(`${process.env.API_BASE_URL}/api/auth/isloggedin`, {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Not authorized");

      const data = await res.json();
      console.log(data);
      console.log(data.userID);

      this.userId = data.userID;
      this.isLoggedIn = true;

      localStorage.setItem("userId", this.userId);
      localStorage.setItem("isLoggedIn", "true");

      return true;
    } catch (err) {
      console.warn("[Auth] Ошибка сети или авторизации:", err.message);

      const cachedLogged = localStorage.getItem("isLoggedIn") === "true";
      const cachedUserId = localStorage.getItem("userId");

      if (cachedLogged && cachedUserId) {
        this.userId = Number(cachedUserId);
        this.isLoggedIn = true;
        console.log("[Auth] Офлайн-режим: использовано локальное состояние.");
        return true;
      }

      this.isLoggedIn = false;
      return false;
    }
  }

  getUserId() {
    return this.userId;
  }

  getCsrfToken(name = "CSRF_token") {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1] || null
    );
  }

  async logout() {
    try {
      const res = await fetch(`${process.env.API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        console.error(`Ошибка разлогина: ${res.status}`);
        return false;
      }
    } catch (e) {
      console.warn("[Auth] Оффлайн разлогин — сервер недоступен.");
    }

    this.userId = null;
    this.isLoggedIn = false;
    localStorage.removeItem("userId");
    localStorage.removeItem("isLoggedIn");

    console.log("Пользователь разлогинен");
    return true;
  }
}

export const authService = new AuthService();
