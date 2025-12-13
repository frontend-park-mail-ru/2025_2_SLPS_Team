import { FeedPage } from '../../Pages/FeedPage/FeedPage.ts';
import { ProfilePage } from '../../Pages/ProfilePage/ProfilePage.ts';
import { MessengerPage } from '../../Pages/MassengerPage/MassengerPage.js';
import { CommunityPage } from '../../Pages/CommunityPage/CommunityPage.js';
import { renderRegPage } from '../../Pages/RegPage/RegPage.js';
import { renderLoginPage } from '../../Pages/LoginPage/LoginPage.js';
import { FriendsPage } from '../../Pages/FriendsPage/FriendsPage.ts';
import { HelpPage } from '../../Pages/HelpPage/HelpPage.js';
import { layout } from '../../Pages/LayoutManager.ts';
import { SupportFormPage } from '../../Pages/SupportFormPage/SupportFormPage.ts';
import { CommunityCheckPage } from '../../Pages/CommunityCheckPage/CommunityCheckPage.js'

import { navigateTo } from './navigateTo.js'; 

window.addEventListener('DOMContentLoaded', () => {
    layout.init().then(() => {
        layout.updateNavbarVisibility();
    });
});

export const routes = {
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
    title: "Регистрация"
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
  "/help": {
    renderFunc: async () => layout.renderPage(HelpPage),
    access: "auth-only",
    title: "Поддержка"
  },
  "/supportform": {
    renderFunc: async () => layout.renderPage(SupportFormPage),
    access: "auth-only",
    title: "Форма"
  },
  '/community/:id': {
    renderFunc: async (params) => layout.renderPage(CommunityCheckPage, params),
    access: 'auth-only',
    title: 'Сообщество',
  }
};