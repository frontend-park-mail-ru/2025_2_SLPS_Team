import { renderMenu } from '../Menu/Menu';
import FeedSettingsTemplate from './FeedSettings.hbs';
import type { MenuItem } from '../Menu/Menu';

type RenderFeedSettingsParams = {
  items: MenuItem[];
  templatePath?: string;
  containerSelector?: string;
};

export async function renderFeedSettings(
  itemsOrParams: MenuItem[] | RenderFeedSettingsParams,
): Promise<HTMLElement> {
  const params: RenderFeedSettingsParams = Array.isArray(itemsOrParams)
    ? { items: itemsOrParams }
    : itemsOrParams;

  const { items, containerSelector = '.settings-menu-container' } = params;

  const rootWrapper = document.createElement('div');
  rootWrapper.innerHTML = FeedSettingsTemplate({});

  const rootEl = rootWrapper.firstElementChild;
  if (!(rootEl instanceof HTMLElement)) {
    throw new Error('[FeedSettings] invalid template root');
  }

  const menuWrapper = await renderMenu({ items });

  const container = rootEl.querySelector<HTMLElement>(containerSelector);
  if (!container) {
    throw new Error(`[FeedSettings] container not found: ${containerSelector}`);
  }

  container.innerHTML = '';
  container.appendChild(menuWrapper);

  return rootEl;
}
