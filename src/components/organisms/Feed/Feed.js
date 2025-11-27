import { renderPost } from "../../molecules/Post/Post.js";
import FeedTemplate from "./Feed.hbs";
import { CreatePostForm } from "../CreatePost/CreatePost.js";
import { EventBus } from "../../../services/EventBus.js";
import { getPosts, getCommunityPosts } from "../../../shared/api/postsApi.js";

const feedInstances = [];
let subscribed = false;

// 🔹 Отдельное хранилище для community-лент
// {
//   [communityId]: [
//     { postsContainer: HTMLElement },
//     ...
//   ]
// }
const communityFeedInstances = {};
let subscribedCommunity = false;

/**
 * Рендер ленты постов.
 *
 * @param {Array} posts        - список постов (как пришли с бэка)
 * @param {boolean} isOwner    - может ли пользователь создавать посты
 * @param {Object} options
 *   - mode: "global" | "community" | ...
 *   - communityId: number | null
 *
 * @returns {Promise<HTMLElement>} DOM-элемент ленты
 */
export async function renderFeed(posts, isOwner, options = {}) {
  const { mode = "global", communityId = null } = options;

  // Рендерим шаблон ленты
  const wrapper = document.createElement("div");
  wrapper.innerHTML = FeedTemplate({
    isOwner,
    mode,
    communityId,
  });

  // Сам корневой элемент ленты
  const feedEl = wrapper.firstElementChild || wrapper;

  // Контейнер с постами
  const postsContainer =
    feedEl.querySelector("[data-role='feed-posts']") ||
    feedEl.querySelector(".feed__posts") ||
    feedEl;

  // Корень для блока "создать пост"
  const createRoot =
    feedEl.querySelector(".feed__create-post") || 
    feedEl.querySelector(".feed__create-post") ||
    feedEl.querySelector(".feed__create") ||
    null;

  // Если владелец — показываем форму создания поста
  if (isOwner && createRoot) {
    const createForm = new CreatePostForm(
      createRoot,
      null, // user_id у тебя в форме не используется, можно не передавать
      "create",
      null,
      mode === "community" && communityId
        ? { communityId }
        : {}
    );

    await createForm.render();
  }

  // Начальная отрисовка постов
  await renderPostsInto(postsContainer, posts);

  /**
   * 🔹 Глобальная лента
   *   — слушает posts:created / posts:updated / posts:deleted
   *   — перерисовывает все глобальные инстансы
   */
  if (mode === "global") {
    feedInstances.push({ postsContainer });

    if (!subscribed) {
      subscribed = true;

      const reloadAllFeeds = async () => {
        try {
          const fresh = await getPosts();
          for (const inst of feedInstances) {
            await renderPostsInto(inst.postsContainer, fresh);
          }
        } catch (e) {
          console.error("[Feed] Ошибка при обновлении глобальной ленты", e);
        }
      };

      EventBus.on("posts:created", reloadAllFeeds);
      EventBus.on("posts:updated", reloadAllFeeds);
      EventBus.on("posts:deleted", reloadAllFeeds);
    }

    return feedEl;
  }

  /**
   * 🔹 Community-лента
   *   — регистрируем инстанс по communityId
   *   — подписываемся один раз на события, связанные с CRUD постов
   */
  if (mode === "community" && communityId) {
    if (!communityFeedInstances[communityId]) {
      communityFeedInstances[communityId] = [];
    }
    communityFeedInstances[communityId].push({ postsContainer });

    if (!subscribedCommunity) {
      subscribedCommunity = true;

      /**
       * Перерисовать одну или все community-ленты.
       * @param {number|null} affectedCommunityId
       */
      const reloadCommunityFeeds = async (affectedCommunityId = null) => {
        try {
          // Если знаем конкретное сообщество — обновляем только его
          if (affectedCommunityId != null) {
            const lists = communityFeedInstances[affectedCommunityId];
            if (!lists || !lists.length) return;

            const fresh = await getCommunityPosts(affectedCommunityId, 1, 20);
            for (const inst of lists) {
              await renderPostsInto(inst.postsContainer, fresh);
            }
            return;
          }

          // Иначе — на всякий случай обновляем все зарегистрированные community-ленты
          const ids = Object.keys(communityFeedInstances);
          for (const id of ids) {
            const intId = Number(id);
            const lists = communityFeedInstances[intId];
            if (!lists || !lists.length) continue;

            const fresh = await getCommunityPosts(intId, 1, 20);
            for (const inst of lists) {
              await renderPostsInto(inst.postsContainer, fresh);
            }
          }
        } catch (e) {
          console.error("[Feed] Ошибка при обновлении community-ленты", e);
        }
      };

      // 👉 CREATE / UPDATE в сообществе — у тебя уже шлётся community:newPost
      EventBus.on("community:newPost", async ({ communityId: cid }) => {
        await reloadCommunityFeeds(cid ?? null);
      });

      // 👉 Дополнительно слушаем общие CRUD-события,
      //    если удаление / изменение поста не шлёт community:newPost.
      const extractCommunityId = (payload = {}) =>
        payload.communityId ??
        payload.communityID ??
        null;

      EventBus.on("posts:created", async (payload) => {
        const cid = extractCommunityId(payload);
        await reloadCommunityFeeds(cid);
      });

      EventBus.on("posts:updated", async (payload) => {
        const cid = extractCommunityId(payload);
        await reloadCommunityFeeds(cid);
      });

      EventBus.on("posts:deleted", async (payload) => {
        const cid = extractCommunityId(payload);
        await reloadCommunityFeeds(cid);
      });
    }
  }

  return feedEl;
}

/**
 * Отрисовывает массив постов внутрь контейнера.
 *
 * @param {HTMLElement} container
 * @param {Array} posts
 */
async function renderPostsInto(container, posts) {
  const safe = Array.isArray(posts) ? posts : [];
  container.innerHTML = "";

  for (const post of safe) {
    // renderPost у тебя уже возвращает DOM-элемент / фрагмент
    container.appendChild(await renderPost(post));
  }
}
