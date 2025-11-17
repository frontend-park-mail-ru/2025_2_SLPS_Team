import { renderPost } from "../../molecules/Post/Post.js";
import FeedTemplate from "./Feed.hbs";
import { CreatePostForm } from "../CreatePost/CreatePost.js";
import { EventBus } from "../../../services/EventBus.js";
import { getPosts } from "../../../shared/api/postsApi.js";

const feedInstances = [];
let subscribed = false;

export async function renderFeed(posts, isOwner = true, options = {}) {
  const { mode = "global" } = options;

  const html = FeedTemplate({ icon: "/public/globalImages/NewPostIcon.svg" });
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html.trim();

  const feedEl = wrapper.firstElementChild;
  let postsContainer = feedEl.querySelector(".feed-posts-container");
  if (!postsContainer) {
    postsContainer = document.createElement("div");
    postsContainer.classList.add("feed-posts-container");
    feedEl.appendChild(postsContainer);
  }

  const newPostButton = feedEl.querySelector(".feed-post-button");
  await renderPostsInto(postsContainer, posts);

  if (!isOwner && newPostButton) {
    newPostButton.style.display = "none";
  } else if (isOwner && newPostButton) {
    const modal = new CreatePostForm(document.body);
    newPostButton.addEventListener("click", () => modal.open());
  }

  if (mode === "global") {
    feedInstances.push({ postsContainer });

    if (!subscribed) {
      subscribed = true;
      const reloadAllFeeds = async () => {
        const fresh = await getPosts();
        for (const inst of feedInstances) {
          await renderPostsInto(inst.postsContainer, fresh);
        }
      };
      EventBus.on("posts:created", reloadAllFeeds);
      EventBus.on("posts:updated", reloadAllFeeds);
      EventBus.on("posts:deleted", reloadAllFeeds);
    }
  }

  return feedEl;
}


async function renderPostsInto(container, posts) {
  const safe = Array.isArray(posts) ? posts : [];
  container.innerHTML = "";
  for (const post of safe) {
    container.appendChild(await renderPost(post));
  }
}
