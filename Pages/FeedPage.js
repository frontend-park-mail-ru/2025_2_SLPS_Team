import BasePage from './BasePage.js';
import { renderMenu } from '../components/molecules/Menu/Menu.js';
import { renderFeed } from '../components/organisms/Feed/Feed.js';
import { renderFeedSettings } from '../components/molecules/FeedSettings/FeedSettings.js';

export class FeedPage extends BasePage{
    constructor(rootElement, posts) {
        super(rootElement);
        this.posts = posts;
    }

    async render(){
        this.destroy();
        const menuItems = [
            { label: "Профиль", view: "profile", icon: "./asserts/MenuIcons/ProfileIcon.svg", isActive: true, onSelect: null },
            { label: "Лента", view: "fedd", icon: "./asserts/MenuIcons/FeedIcon.svg", onSelect: null },
            { label: "Сообщества", view: "community", icon: "/asserts/MenuIcons/FeedIcon.svg", onSelect: null},
            { label: "Месенджер", view: "messenger", icon: "/asserts/MenuIcons/MessengerIcon.svg", onSelect: null},
            { label: "Друзья", view: "friends", icon: "/asserts/MenuIcons/FriendsIcon.svg", onSelect: null}
        ];

        const menuElement = await renderMenu({items: menuItems});
        this.rootElement.appendChild(menuElement);

        const FeedElement = await renderFeed(this.posts);
        this.rootElement.appendChild(FeedElement);

        const SeettingsFeedItems = [
            { label: "Рекомендации", view: "recomendations", isActive: true, onSelect: null },
            { label: "Подписки", view: "subs", onSelect: null },
            { label: "Реакции", view: "reactions", onSelect: null},
        ];
        const feedSettingsElement = await renderFeedSettings(SeettingsFeedItems);
        this.rootElement.appendChild(feedSettingsElement);

    }
}