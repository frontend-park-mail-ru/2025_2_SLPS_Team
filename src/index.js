import {FeedPage} from "./Pages/FeedPage/FeedPage.js";
import { ProfilePage } from "./Pages/ProfilePage/ProfilePage.js";
import { MessengerPage } from "./Pages/MassengerPage/MassengerPage.js";
import { LayoutManager } from "./Pages/LayoutManager.js";
import { CommunityPage } from "./Pages/CommunityPage/CommunityPage.js";
import {renderRegPage} from "./Pages/RegPage/RegPage.js";
import {renderLoginPage} from "./Pages/LoginPage/LoginPage.js";
import { FriendsPage } from "./Pages/FriendsPage/FriendsPage.js";
import { authService } from "./services/AuthService.js";

import './index.css';


const layout = new LayoutManager(document.body, navigateTo);

document.addEventListener('DOMContentLoaded', router);

const routes = {
    "/": {
        renderFunc: async () => layout.renderPage(FeedPage),
        access: "auth-only",
        title: "Лента"
    },
    "/login": {
        renderFunc: async () => {
            document.body.innerHTML = '';
            await renderLoginPage(document.body, {
                onSubmit: () => navigateTo("/"),
                onReg: () => navigateTo("/register")
            });
        },
        access: "guest-only",
        title: "Вход"
    },
    "/register": {
        renderFunc: async () => {
            document.body.innerHTML = '';
            await renderRegPage(document.body, {
                onSubmit: () => navigateTo("/"),
                onLog: () => navigateTo("/login")
            });
        },
        access: "guest-only",
        title: "Регистарция"
    },
    "/profile": {
        renderFunc: async () => layout.renderPage(ProfilePage),
        access: "auth-only",
        title: "Профиль"
    },
    "/messanger": {
        renderFunc: async () => layout.renderPage(MessengerPage),
        access: "auth-only",
        title: "Мессенджер"
    },
    "/community": {
        renderFunc: async () => layout.renderPage(CommunityPage),
        access: "auth-only",
        title: "Сообщества"
    },
    "/friends": {
        renderFunc: async () => layout.renderPage(FriendsPage),
        access: "auth-only",
        title: "Друзья"
    },
    "/profile/:id": {
        renderFunc: async (params) => layout.renderPage(ProfilePage, params),
        access: "auth-only",
        title: "Профиль пользователя"
    },
};

export function navigateTo(url) {
    history.pushState(null, null, url);
    router();
}


async function router() {
    const path = window.location.pathname;
    console.log("Current path:", path);

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
    console.log(loggedIn)
    if (access === "guest-only" && loggedIn) {
        navigateTo("/");
        return;
    }
    if (access === "auth-only" && !loggedIn) {
        navigateTo("/register");
        return;
    }

    document.title = route.title;

    await route.renderFunc(params);
}


function matchDynamicRoute(routePath, urlPath) {
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
