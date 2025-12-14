import BasePage from '../BasePage';
import FeedPageTemplate from './FeedPage.hbs';

import { renderFeed } from '../../components/organisms/Feed/Feed';
import { renderFeedSettings } from '../../components/molecules/FeedSettings/FeedSettings';
import { getPosts } from '../../shared/api/postsApi';

import type { MenuItem } from '../../components/molecules/Menu/Menu';

type PostApiResponse = Record<string, unknown>;

export class FeedPage extends BasePage {
  private posts: PostApiResponse[] = [];

  constructor(rootElement: HTMLElement) {
    super(rootElement);
  }

  async render(): Promise<void> {
    const existingWrapper = document.getElementById('feed-wrapper');
    if (existingWrapper) existingWrapper.remove();

    const wrapper = document.createElement('div');
    wrapper.id = 'feed-wrapper';
    wrapper.innerHTML = FeedPageTemplate({});

    const mainContainer = wrapper.querySelector<HTMLElement>('.feed-page');
    if (!mainContainer) {
      throw new Error('[FeedPage] .feed-page not found in template');
    }

    try {
      this.posts = (await getPosts()) as PostApiResponse[];
    } catch (err: unknown) {
      console.warn('Не удалось получить посты:', err);
      this.posts = [];
    }

    const feedElement = await renderFeed(this.posts, true);
    mainContainer.appendChild(feedElement);

    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      const settingsItems: MenuItem[] = [
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
