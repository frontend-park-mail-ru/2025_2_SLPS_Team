import BasePage from '../BasePage.js';
import { renderFeed } from '../../components/organisms/Feed/Feed.js';
import FeedPageTemplate from './FeedPage.hbs';
import { renderFeedSettings } from '../../components/molecules/FeedSettings/FeedSettings.js';
import { getPosts } from '../../shared/api/postsApi.js';

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
    const existingWrapper = document.getElementById('feed-wrapper');
    if (existingWrapper) {
      existingWrapper.remove();
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'feed-wrapper';
    wrapper.innerHTML = FeedPageTemplate();

    const mainContainer = wrapper.querySelector('.feed-page');

    try {
      this.posts = await getPosts();
    } catch (err) {
      console.warn('Не удалось получить посты:', err);
      this.posts = [];
    }

    const feedElement = await renderFeed(this.posts, true);
    mainContainer.appendChild(feedElement);

    const isMobile = window.innerWidth <= 768;
    if(!isMobile) {
        const settingsItems = [
            { label: 'Рекомендации', view: 'recommendations', isActive: true },
            { label: 'Подписки', view: 'subs' },
            { label: 'Реакции', view: 'reactions' },
            ];
        const feedSettingsElement = await renderFeedSettings(settingsItems);
        mainContainer.appendChild(feedSettingsElement);
    }

    this.rootElement.appendChild(wrapper);
  }
}
