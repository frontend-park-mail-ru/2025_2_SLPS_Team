import { renderPost } from '../../molecules/Post/Post';
import FeedTemplate from './Feed.hbs';
import { CreatePostForm } from '../CreatePost/CreatePost';
import { EventBus } from '../../../services/EventBus.js';
import { getPosts } from '../../../shared/api/postsApi.js';


export type PostData = any;

export type FeedMode = 'global' | 'community' | string;

export interface FeedOptions {
  mode?: FeedMode;
  communityId?: number | null;
}

interface FeedInstance {
  postsContainer: HTMLElement;
}

const feedInstances: FeedInstance[] = [];
let subscribed = false;

export async function renderFeed(
  posts: PostData[],
  isOwner: boolean = true,
  options: FeedOptions = {},
): Promise<HTMLElement> {
  const { mode = 'global', communityId = null } = options;

  const html: string = FeedTemplate({ icon: '/public/globalImages/NewPostIcon.svg' });
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();

  const feedEl = wrapper.firstElementChild as HTMLElement;

  let postsContainer =
    (feedEl.querySelector('.feed-posts-container') as HTMLElement | null) ?? null;

  if (!postsContainer) {
    postsContainer = document.createElement('div');
    postsContainer.classList.add('feed-posts-container');
    feedEl.appendChild(postsContainer);
  }

  const newPostButton = feedEl.querySelector('.feed-post-button') as
    | HTMLElement
    | null;

  await renderPostsInto(postsContainer, posts);

  const feedHeader = feedEl.querySelector('.feed-header') as HTMLElement | null;

  if (!isOwner && newPostButton && feedHeader) {
    feedHeader.remove();
  } else if (isOwner && newPostButton) {
    let modal: CreatePostForm;

    if (mode === 'community' && communityId) {
      modal = new CreatePostForm(document.body, null, 'create', null, { communityId });
    } else {
      modal = new CreatePostForm(document.body, null);
    }

    newPostButton.addEventListener('click', () => modal.open());
  }

  if (mode === 'global') {
    feedInstances.push({ postsContainer });

    if (!subscribed) {
      subscribed = true;

      const reloadAllFeeds = async () => {
        const fresh: PostData[] = await getPosts();
        for (const inst of feedInstances) {
          await renderPostsInto(inst.postsContainer, fresh);
        }
      };

      EventBus.on('posts:created', reloadAllFeeds);
      EventBus.on('posts:updated', reloadAllFeeds);
      EventBus.on('posts:deleted', reloadAllFeeds);
    }
  }

  return feedEl;
}

async function renderPostsInto(
  container: HTMLElement,
  posts: PostData[],
): Promise<void> {
  const safe: PostData[] = Array.isArray(posts) ? posts : [];
  container.innerHTML = '';

  const renderPostOneArg = renderPost as unknown as (
    post: PostData,
  ) => Promise<HTMLElement> | HTMLElement;

  for (const post of safe) {
    const el = await renderPostOneArg(post);
    container.appendChild(el);
  }
}
