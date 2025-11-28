import { renderNavbar } from '../components/molecules/Navbar/Navbar.js';
import { renderMenu } from '../components/molecules/Menu/Menu.js';
import { NotificationManager } from '../components/organisms/NotificationsBlock/NotificationsManager.js';
import { authService } from '../services/AuthService.js';
import { SupportWidget } from '../components/organisms/SupportWidget/SupportWidget.js';

import { navigateTo } from '../index.js';

export class LayoutManager {
    constructor(rootElement, navigateTo) {
        this.root = rootElement;
        this.navbar = null;
        this.menu = null;
        this.content = null;
        this.initialized = false;
        this.navigateTo = navigateTo;
        this.NotificationManager = new NotificationManager();
        this.supportWidget = null;
    }

    async init() {
        if (this.initialized) return;
        const avatar = await this.getAvatar();
        this.navbar = await renderNavbar(avatar);

        const layoutWrapper = document.createElement('div');
        layoutWrapper.classList.add('layout-wrapper');

        const menuItems = [
            { label: "Профиль", view: "/profile", icon: "/public/MenuIcons/ProfileIcon.svg" },
            { label: "Лента", view: "/", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Сообщества", view: "/community", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Мессенджер", view: "/messanger", icon: "/public/MenuIcons/MessengerIcon.svg" },
            { label: "Друзья", view: "/friends", icon: "/public/MenuIcons/FriendsIcon.svg" },
            { label: "Поддержка", view: "/help", icon: "/public/MenuIcons/HelpIcon.svg" }
        ];

        this.menu = await renderMenu({
            items: menuItems,
            onNavigate: (path) => this.navigateTo(path)
        });

        this.content = document.createElement('div');
        this.content.classList.add('page-content');

        layoutWrapper.appendChild(this.menu);
        layoutWrapper.appendChild(this.content);

        this.root.innerHTML = '';
        this.root.appendChild(this.navbar);
        this.root.appendChild(layoutWrapper);
        this.NotificationManager.init();

        if (!this.supportWidget) {
            this.supportWidget = new SupportWidget(document.body);
            this.supportWidget.render();
        }

        this.initialized = true;
    }

    clearContent() {
        if (this.content) {
            this.content.innerHTML = '';
        }
    }

    async renderPage(PageClass, params = {}) {
        this.updateNavbarVisibility();

        await this.init();
        this.clearContent();
        const pageInstance = new PageClass(this.content, params);
        await pageInstance.render();

        this.updateNavbarVisibility();
    }

    async getAvatar() {
        const res = await fetch(`${process.env.API_BASE_URL}/api/profile/${authService.getUserId()}`, {
            credentials: 'include',
            method: 'GET'
        });

        const data = await res.json();
        console.log(data);
        return data.avatarPath;
    }

    async rerenderLayout() {
        if (!this.initialized) return;

        const avatar = await this.getAvatar();

        const newNavbar = await renderNavbar(avatar);

        const menuItems = [
            { label: "Профиль", view: "/profile", icon: "/public/MenuIcons/ProfileIcon.svg" },
            { label: "Лента", view: "/", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Сообщества", view: "/community", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Мессенджер", view: "/messanger", icon: "/public/MenuIcons/MessengerIcon.svg" },
            { label: "Друзья", view: "/friends", icon: "/public/MenuIcons/FriendsIcon.svg" },
            { label: "Поддержка", view: "/help", icon: "/public/MenuIcons/HelpIcon.svg" }
        ];
        const newMenu = await renderMenu({
            items: menuItems,
            onNavigate: (path) => this.navigateTo(path)
        });

        const layoutWrapper = this.root.querySelector('.layout-wrapper');
        if (layoutWrapper) {
            layoutWrapper.innerHTML = '';
            layoutWrapper.appendChild(newMenu);
            layoutWrapper.appendChild(this.content);
        }

        if (this.navbar && this.root.contains(this.navbar)) {
            this.root.replaceChild(newNavbar, this.navbar);
        } else {
            this.root.insertBefore(newNavbar, layoutWrapper);
        }

        this.navbar = newNavbar;
        this.menu = newMenu;
    }

    updateNavbarVisibility() {
        const isMobile = window.innerWidth <= 768;

        const path = location.pathname;

        const isProfile = path.startsWith("/profile");
        const isMessenger = path.startsWith("/messanger");

        const isCommunitySubpage = /^\/community\/.+/.test(path);

        const isHiddenPage = isProfile || isMessenger || isCommunitySubpage;

        if (isMobile && isHiddenPage) {
            if (this.navbar) this.navbar.style.display = 'none';
        } else {
            if (this.navbar) this.navbar.style.display = '';
        }
    }

    toggleMenu() {
        const menu = this.menu;
        if (!menu) {
            console.log("menu not found");
            return;
        }

        const sidebar = menu.sidebarContainer;
        console.log("sidebar:", sidebar);

        if (!sidebar) {
            console.log("sidebarContainer not found inside menu");
            return;
        }

        sidebar.classList.toggle("menu-hidden");
    }

}

export const layout = new LayoutManager(document.body, navigateTo);
