import { FeedPage } from '../../Pages/FeedPage/FeedPage';
import { ProfilePage } from '../../Pages/ProfilePage/ProfilePage';
import { MassengerPage } from '../../Pages/MassengerPage/MassengerPage';
import { CommunityPage } from '../../Pages/CommunityPage/CommunityPage';
import { renderRegPage } from '../../Pages/RegPage/RegPage';
import { renderLoginPage } from '../../Pages/LoginPage/LoginPage';
import { FriendsPage } from '../../Pages/FriendsPage/FriendsPage';
import { HelpPage } from '../../Pages/HelpPage/HelpPage';
import { layout } from '../../Pages/LayoutManager';
import { SupportFormPage } from '../../Pages/SupportFormPage/SupportFormPage';
import { CommunityCheckPage } from '../../Pages/CommunityCheckPage/CommunityCheckPage';

import { navigateTo } from './navigateTo';
import type { RoutesMap } from './createRouter';

export const routes: RoutesMap = {
  '/': {
    renderFunc: async () => layout.renderPage(FeedPage),
    access: 'auth-only',
    title: 'Лента',
  },

  '/login': {
    renderFunc: async () => {
      document.body.innerHTML = '';
      await renderLoginPage(document.body, {
        onSubmit: () => navigateTo('/'),
        onReg: () => navigateTo('/register'),
      });
    },
    access: 'guest-only',
    title: 'Вход',
  },

  '/register': {
    renderFunc: async () => {
      document.body.innerHTML = '';
      await renderRegPage(document.body, {
        onSubmit: () => navigateTo('/'),
        onLog: () => navigateTo('/login'),
      });
    },
    access: 'guest-only',
    title: 'Регистрация',
  },

  '/profile': {
    renderFunc: async () => layout.renderPage(ProfilePage),
    access: 'auth-only',
    title: 'Профиль',
  },

  '/messanger': {
    renderFunc: async () => layout.renderPage(MassengerPage),
    access: 'auth-only',
    title: 'Мессенджер',
  },

  '/community': {
    renderFunc: async () => layout.renderPage(CommunityPage),
    access: 'auth-only',
    title: 'Сообщества',
  },

  '/friends': {
    renderFunc: async () => layout.renderPage(FriendsPage),
    access: 'auth-only',
    title: 'Друзья',
  },

  '/profile/:id': {
    renderFunc: async (params) =>
      layout.renderPage(ProfilePage, params),
    access: 'auth-only',
    title: 'Профиль пользователя',
  },

  '/help': {
    renderFunc: async () => layout.renderPage(HelpPage),
    access: 'auth-only',
    title: 'Поддержка',
  },

  '/supportform': {
    renderFunc: async () => layout.renderPage(SupportFormPage),
    access: 'auth-only',
    title: 'Форма',
  },

  '/community/:id': {
    renderFunc: async (params) =>
      layout.renderPage(CommunityCheckPage, params),
    access: 'auth-only',
    title: 'Сообщество',
  },
};
