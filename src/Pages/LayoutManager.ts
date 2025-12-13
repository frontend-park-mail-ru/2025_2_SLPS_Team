import { renderNavbar } from '../components/molecules/Navbar/Navbar';
import { renderMenu } from '../components/molecules/Menu/Menu';
import { NotificationManager } from '../components/organisms/NotificationsBlock/NotificationsManager';
import { authService } from '../services/AuthService';
import { SupportWidget } from '../components/organisms/SupportWidget/SupportWidget.js';

import { navigateTo as defaultNavigateTo } from '../index';

type NavigateTo = (path: string) => void;

type MenuItem = {
  label: string;
  view: string;
  icon: string;
};

type RenderMenuResult = HTMLElement & {
  sidebarContainer?: HTMLElement | null;
};

export interface PageConstructor<TParams extends Record<string, unknown> = Record<string, unknown>> {
  new (root: HTMLElement, params?: TParams): {
    render(): Promise<void> | void;
    destroy?: () => void;
  };
}

export class LayoutManager {
  private root: HTMLElement;

  private navbar: HTMLElement | null = null;
  private menu: RenderMenuResult | null = null;
  private content: HTMLDivElement | null = null;

  private initialized = false;

  private readonly navigateTo: NavigateTo;
  private readonly notificationManager = new NotificationManager();

  private supportWidget: SupportWidget | null = null;

  private initPromise: Promise<void> | null = null;

  private avatarPromise: Promise<string | null> | null = null;
  private avatarCache: { value: string | null; ts: number } | null = null;
  private readonly avatarTtlMs = 30_000;

  constructor(rootElement: HTMLElement, navigate: NavigateTo = defaultNavigateTo) {
    this.root = rootElement;
    this.navigateTo = navigate;

    window.addEventListener('resize', () => this.updateNavbarVisibility());
  }

  private getMenuItems(): MenuItem[] {
    return [
      { label: 'Профиль', view: '/profile', icon: '/public/MenuIcons/ProfileIcon.svg' },
      { label: 'Лента', view: '/', icon: '/public/MenuIcons/FeedIcon.svg' },
      { label: 'Сообщества', view: '/community', icon: '/public/MenuIcons/FeedIcon.svg' },
      { label: 'Мессенджер', view: '/messanger', icon: '/public/MenuIcons/MessengerIcon.svg' },
      { label: 'Друзья', view: '/friends', icon: '/public/MenuIcons/FriendsIcon.svg' },
      { label: 'Поддержка', view: '/help', icon: '/public/MenuIcons/HelpIcon.svg' },
    ];
  }

  public invalidateAvatarCache(): void {
    this.avatarCache = null;
    this.avatarPromise = null;
  }

  private async getAvatarCached(): Promise<string | null> {
    const userId = authService.getUserId();
    if (!userId) return null;

    const now = Date.now();
    if (this.avatarCache && now - this.avatarCache.ts < this.avatarTtlMs) {
      return this.avatarCache.value;
    }

    if (this.avatarPromise) return this.avatarPromise;

    this.avatarPromise = (async () => {
      try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/profile/${userId}`, {
          credentials: 'include',
          method: 'GET',
        });

        if (!res.ok) return null;

        const data = (await res.json()) as { avatarPath?: string | null };
        const value = data.avatarPath ?? null;

        this.avatarCache = { value, ts: Date.now() };
        return value;
      } finally {
        this.avatarPromise = null;
      }
    })();

    return this.avatarPromise;
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const avatar = await this.getAvatarCached();

      this.navbar = renderNavbar(avatar);

      const layoutWrapper = document.createElement('div');
      layoutWrapper.classList.add('layout-wrapper');

      const menuItems = this.getMenuItems();

      this.menu = (await renderMenu({
        items: menuItems,
        onNavigate: (path: string) => this.navigateTo(path),
      })) as RenderMenuResult;

      this.content = document.createElement('div');
      this.content.classList.add('page-content');

      layoutWrapper.appendChild(this.menu);
      layoutWrapper.appendChild(this.content);

      this.root.innerHTML = '';
      this.root.appendChild(this.navbar);
      this.root.appendChild(layoutWrapper);

      this.notificationManager.init();

      if (!this.supportWidget) {
        this.supportWidget = new SupportWidget(document.body);
        this.supportWidget.render();
      }

      this.initialized = true;

      this.updateNavbarVisibility();
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  private clearContent(): void {
    if (this.content) this.content.innerHTML = '';
  }

  public async renderPage<TParams extends Record<string, unknown>>(
    PageClass: PageConstructor<TParams>,
    params?: TParams,
  ): Promise<void> {
    await this.init();

    this.clearContent();
    if (!this.content) throw new Error('[LayoutManager] content container missing');

    const pageInstance = new PageClass(this.content, params);
    await pageInstance.render();

    this.updateNavbarVisibility();
  }

  public async rerenderLayout(): Promise<void> {
    if (!this.initialized) return;

    const avatar = await this.getAvatarCached();

    const newNavbar = renderNavbar(avatar);

    const menuItems = this.getMenuItems();
    const newMenu = (await renderMenu({
      items: menuItems,
      onNavigate: (path: string) => this.navigateTo(path),
    })) as RenderMenuResult;

    const layoutWrapper = this.root.querySelector<HTMLElement>('.layout-wrapper');
    if (layoutWrapper && this.content) {
      layoutWrapper.innerHTML = '';
      layoutWrapper.appendChild(newMenu);
      layoutWrapper.appendChild(this.content);
    }

    if (this.navbar && this.root.contains(this.navbar) && layoutWrapper) {
      this.root.replaceChild(newNavbar, this.navbar);
    } else if (layoutWrapper) {
      this.root.insertBefore(newNavbar, layoutWrapper);
    }

    this.navbar = newNavbar;
    this.menu = newMenu;

    this.updateNavbarVisibility();
  }

  public updateNavbarVisibility(): void {
    const isMobile = window.innerWidth <= 768;
    const path = location.pathname;

    const isProfile = path.startsWith('/profile');
    const isMessenger = path.startsWith('/messanger');
    const isCommunitySubpage = /^\/community\/.+/.test(path);

    const isHiddenPage = isProfile || isMessenger || isCommunitySubpage;

    if (this.navbar) {
      this.navbar.style.display = isMobile && isHiddenPage ? 'none' : '';
    }
  }

  public toggleMenu(): void {
    const sidebar = this.menu?.sidebarContainer;
    if (!sidebar) return;
    sidebar.classList.toggle('menu-hidden');
  }
}

export const layout = new LayoutManager(document.body, defaultNavigateTo);
