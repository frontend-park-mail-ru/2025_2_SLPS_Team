import BasePage from '../BasePage.js';
import { renderMenu } from '../../components/molecules/Menu/Menu.js';
import { renderFeed } from '../../components/organisms/Feed/Feed.js';
import { renderFeedSettings } from '../../components/molecules/FeedSettings/FeedSettings.js';
import { renderNavbar } from '../../components/molecules/Navbar/Navbar.js';
import FeedPageTemplate from './FeedPage.hbs';

async function getPosts(limit = 10, page = 1) {
    try {
        const params = new URLSearchParams({ limit, page });
        const res = await fetch(`${process.env.API_BASE_URL}/api/posts?${params.toString()}`);
        if (!res.ok) throw new Error("Ошибка HTTP " + res.status);
        return await res.json();
    } catch (err) {
        console.warn("Используем моковые посты, сервер недоступен", err);
    }
}

/**
 * Класс для отображения страницы ленты.
 *
 * @class FeedPage
 * @extends BasePage
 *
 * @param {HTMLElement} rootElement - Корневой DOM-элемент, в который будет рендериться страница.
 * @property {Object[]} posts - Массив постов, отображаемых в ленте.
 */
export class FeedPage extends BasePage {
    constructor(rootElement) {
        super(rootElement);
        this.posts = [];
    }

    async render() {
        const navbarElement = await renderNavbar();
        document.body.appendChild(navbarElement);
        const existingWrapper = document.getElementById('feed-wrapper');
        if (existingWrapper) {
            existingWrapper.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'feed-wrapper';
        wrapper.innerHTML = FeedPageTemplate();
        const mainContainer = wrapper.querySelector('.feed-page');

        const menuItems = [
            { label: "Профиль", view: "profile", icon: "/public/MenuIcons/ProfileIcon.svg", isActive: true },
            { label: "Лента", view: "feed", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Сообщества", view: "community", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Месенджер", view: "messenger", icon: "/public/MenuIcons/MessengerIcon.svg" },
            { label: "Друзья", view: "friends", icon: "/public/MenuIcons/FriendsIcon.svg" }
        ];
        const menuElement = await renderMenu({ items: menuItems });
        mainContainer.appendChild(menuElement);

        this.posts = await getPosts(10, 1);
        const feedElement = await renderFeed(this.posts.posts);
        mainContainer.appendChild(feedElement);

        const settingsItems = [
            { label: "Рекомендации", view: "recommendations", isActive: true },
            { label: "Подписки", view: "subs" },
            { label: "Реакции", view: "reactions" }
        ];
        const feedSettingsElement = await renderFeedSettings(settingsItems);
        mainContainer.appendChild(feedSettingsElement);

        this.rootElement.appendChild(wrapper);
    }


}
