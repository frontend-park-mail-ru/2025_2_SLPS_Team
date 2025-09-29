import BasePage from '../BasePage.js';
import { renderMenu } from '../../components/molecules/Menu/Menu.js';
import { renderFeed } from '../../components/organisms/Feed/Feed.js';
import { renderFeedSettings } from '../../components/molecules/FeedSettings/FeedSettings.js';
import CONFIG from '/config.js'



const POSTS = [{
    groupName: "Fast Food Music",
    groupIcon: "path/to/icon.png",
    subscribed: false,
    text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
    photos: [
        "./asserts/postImage.jpg",
        "./asserts/groupImage1.png",
        "./asserts/PostPhoto3.jpg",
        "./asserts/PostPhoto4.png"
    ],
    communityAvatar: "./asserts/groupImage1.png",
    likes: 5,
    reposts: 2,
    comments: 3
}, {
    groupName: "Fast Food Music",
    groupIcon: "path/to/icon.png",
    subscribed: false,
    text: "С днём рождения, Boulevard Depo!\nТалантливому рэп-артисту, стоявшему у истоков творческого объединения YungRussia и продолжающему развивать успешную сольную карьеру, сегодня исполнилось 34 года.\n#ffmbirthdays",
    photos: [
        "./asserts/postImage.jpg",
        "./asserts/groupImage1.png",
        "./asserts/PostPhoto3.jpg",
        "./asserts/PostPhoto4.png"
    ],
    communityAvatar: "./asserts/groupImage1.png",
    likes: 5,
    reposts: 2,
    comments: 3
}];


async function getPosts(limit = 10, page = 1) {
    try {
        const params = new URLSearchParams({ limit, page });
        const res = await fetch(`${CONFIG.API_BASE_URL}/api/posts?${params.toString()}`);
        if (!res.ok) throw new Error("Ошибка HTTP " + res.status);
        return await res.json();
    } catch (err) {
        console.warn("Используем моковые посты, сервер недоступен", err);
        return POSTS;
    }
}

export class FeedPage extends BasePage {
    constructor(rootElement) {
        super(rootElement);
        this.posts = [];
    }

    async render() {
        this.destroy();

        const template = Handlebars.templates['FeedPage.hbs'];
        const wrapper = document.createElement('div');
        wrapper.innerHTML = template();
        const mainContainer = wrapper.querySelector('.feed-page');

        const menuItems = [
            { label: "Профиль", view: "profile", icon: "./asserts/MenuIcons/ProfileIcon.svg", isActive: true },
            { label: "Лента", view: "feed", icon: "./asserts/MenuIcons/FeedIcon.svg" },
            { label: "Сообщества", view: "community", icon: "/asserts/MenuIcons/FeedIcon.svg" },
            { label: "Месенджер", view: "messenger", icon: "/asserts/MenuIcons/MessengerIcon.svg" },
            { label: "Друзья", view: "friends", icon: "/asserts/MenuIcons/FriendsIcon.svg" }
        ];
        const menuElement = await renderMenu({ items: menuItems });

        const sidebar = mainContainer.querySelector('.sidebar-menu');
        if (sidebar) {
            sidebar.appendChild(menuElement);
        } else {
            console.warn("Не найден .sidebar-menu, меню вставляется в mainContainer");
            mainContainer.appendChild(menuElement);
        }

        this.posts = await getPosts(10, 1);
        const feedElement = await renderFeed(this.posts);
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
