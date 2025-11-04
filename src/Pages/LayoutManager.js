import { renderNavbar } from '../components/molecules/Navbar/Navbar.js';
import { renderMenu } from '../components/molecules/Menu/Menu.js';
import { NotificationManager } from '../components/organisms/NotificationsBlock/NotificationsManager.js';

export class LayoutManager {
    constructor(rootElement, navigateTo) {
        this.root = rootElement;
        this.navbar = null;
        this.menu = null;
        this.content = null;
        this.initialized = false;
        this.navigateTo = navigateTo;
        this.NotificationManager = new NotificationManager();
    }

    async init() {
        if (this.initialized) return;

        this.navbar = await renderNavbar();

        const layoutWrapper = document.createElement('div');
        layoutWrapper.classList.add('layout-wrapper');

        const menuItems = [
            { label: "Профиль", view: "/profile", icon: "/public/MenuIcons/ProfileIcon.svg" },
            { label: "Лента", view: "/", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Сообщества", view: "/community", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Мессенджер", view: "/messanger", icon: "/public/MenuIcons/MessengerIcon.svg" },
            { label: "Друзья", view: "/friends", icon: "/public/MenuIcons/FriendsIcon.svg" }
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

        this.initialized = true;
    }

    clearContent() {
        if (this.content) {
            this.content.innerHTML = '';
        }
    }

    async renderPage(PageClass, params = {}) {
        await this.init();
        this.clearContent();
        const pageInstance = new PageClass(this.content, params);
        await pageInstance.render();
    }
}
