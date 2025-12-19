import { renderPost } from '../../molecules/Post/Post';
import FeedTemplate from './Feed.hbs';
import { CreatePostForm } from '../CreatePost/CreatePost';
import { EventBus } from '../../../services/EventBus';
import { getPosts } from '../../../shared/api/postsApi';

export type PostData = any;

export type FeedMode = 'global' | 'community' | string;

export interface FeedOptions {
  mode?: FeedMode;
  communityId?: number | null;
}

interface FeedInstance {
  postsContainer: HTMLElement;

  page: number;
  limit: number;
  isLoading: boolean;
  reachedEnd: boolean;

  loadedIds: Set<number>;
  sentinel: HTMLElement | null;
  observer: IntersectionObserver | null;
}

const feedInstances: FeedInstance[] = [];
let subscribed = false;

function getPostId(p: any): number | null {
  const id = p?.id;
  return typeof id === 'number' ? id : null;
}

async function renderPostsInto(container: HTMLElement, posts: PostData[]): Promise<void> {
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

async function appendPostsInto(
  container: HTMLElement,
  posts: PostData[],
  beforeEl?: HTMLElement | null,
) {  const safe: PostData[] = Array.isArray(posts) ? posts : [];

  const renderPostOneArg = renderPost as unknown as (
    post: PostData,
  ) => Promise<HTMLElement> | HTMLElement;

  for (const post of safe) {
    const el = await renderPostOneArg(post);
    if (beforeEl) container.insertBefore(el, beforeEl);
    else container.appendChild(el);
  }

}

async function getPostsPage(page: number, limit: number): Promise<PostData[]> {
  const offset = page * limit;
  const fn = getPosts as unknown as (o?: number, l?: number) => Promise<PostData[]>;
  return fn(offset, limit);
}


async function getPostsUpToPage(maxPage: number, limit: number): Promise<PostData[]> {
  const out: PostData[] = [];
  for (let p = 0; p <= maxPage; p++) {
    const batch = await getPostsPage(p, limit);

    if (p === 0 && batch.length > limit * 2) return batch;

    out.push(...batch);
    if (batch.length < limit) break;
  }
  return out;
}

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

  const newPostButton = feedEl.querySelector('.feed-post-button') as HTMLElement | null;

  const containerEl = postsContainer as HTMLElement;
await renderPostsInto(containerEl, posts);


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
    const inst: FeedInstance = {
      postsContainer: containerEl,
      page: 0,
      limit: 20,
      isLoading: false,
      reachedEnd: false,
      loadedIds: new Set<number>(),
      sentinel: null,
      observer: null,
    };

    for (const p of (Array.isArray(posts) ? posts : [])) {
      const id = getPostId(p);
      if (id !== null) inst.loadedIds.add(id);
    }

    const sentinel = document.createElement('div');
    sentinel.className = 'feed-sentinel';
    sentinel.style.height = '1px';
    containerEl.appendChild(sentinel);
    inst.sentinel = sentinel;

    async function loadMore() {
      if (inst.isLoading || inst.reachedEnd) return;
      inst.isLoading = true;

      try {
        const nextPage = inst.page + 1;
        const batch = await getPostsPage(nextPage, inst.limit);

        if (!batch.length) {
          inst.reachedEnd = true;
          return;
        }
        console.log('nextPage', nextPage);
        console.log('batch ids', batch.map((p: any) => p?.id));
        console.log('loaded ids', Array.from(inst.loadedIds));
        const unique = batch.filter((p) => {
          const id = getPostId(p);
          if (id === null) return true;
          if (inst.loadedIds.has(id)) return false;
          inst.loadedIds.add(id);
          return true;
        });

        if (unique.length) {
          await appendPostsInto(containerEl, unique, inst.sentinel);
          }

        inst.page = nextPage;

        if (batch.length < inst.limit) inst.reachedEnd = true;
      } finally {
        inst.isLoading = false;
      }
    }

    inst.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries && entries.length ? entries[0] : undefined;
        if (!entry) return;
        if (entry.isIntersecting) void loadMore();
      },
      { root: null, rootMargin: '600px 0px', threshold: 0 },
    );

    inst.observer.observe(sentinel);

    feedInstances.push(inst);

    if (!subscribed) {
      subscribed = true;

      const reloadAllFeeds = async () => {
        for (const f of feedInstances) {
          const fresh = await getPostsUpToPage(f.page, f.limit);

          f.loadedIds.clear();
          for (const p of fresh) {
            const id = getPostId(p);
            if (id !== null) f.loadedIds.add(id);
          }

          await renderPostsInto(f.postsContainer, fresh);

          if (f.sentinel) {
            f.postsContainer.appendChild(f.sentinel);
            f.observer?.observe(f.sentinel);
          }
        }
      };

      EventBus.on('posts:created', reloadAllFeeds);
      EventBus.on('posts:updated', reloadAllFeeds);
      EventBus.on('posts:deleted', reloadAllFeeds);
    }
  }

  return feedEl;
}
