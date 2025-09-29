import { renderMenu } from '../Menu/Menu.js';

export async function renderFeedSettings(items) {
    const menuWrapper = await renderMenu({
        items: items,
        templatePath: "./components/molecules/FeedSettings/FeedSettings.hbs",
        containerSelector: '.settings-menu-container'
    })
    return menuWrapper;
}
