import { renderPost } from "../../molecules/Post/Post.js";
import FeedTemplate from './Feed.hbs'
import {CreatePostForm} from '../CreatePost/CreatePost.js';

/**
 * Рендерит ленту постов.
 *
 * @async
 * @function renderFeed
 * @param {Object[]} posts - Массив объектов постов для отображения.
 * @param {string} posts[].id - Уникальный идентификатор поста.
 * @param {string} posts[].author - Автор поста.
 * @param {string} posts[].text - Текст поста.
 * @param {string|string[]} [posts[].photos] - Фото или массив фото, прикреплённых к посту.
 * @param {number} [posts[].like_count] - Количество лайков у поста.
 * @returns {Promise<HTMLElement>} DOM-элемент ленты, содержащий все посты.
 */
export async function renderFeed(posts, isOwner=true){
    const template = FeedTemplate;
    const html = template({icon: "/public/globalImages/NewPostIcon.svg"});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim()

    const FeedElement = wrapper.firstElementChild;

    const safePosts = Array.isArray(posts) ? posts : [];

    for(const postData of safePosts){
        FeedElement.appendChild(await renderPost(postData));
    }

    const newPostButton = wrapper.querySelector('.feed-post-button');

    if (!isOwner && newPostButton) {
        newPostButton.style.display = 'none';
    }

    if (isOwner && newPostButton) {
        const NewPostModal = new CreatePostForm(document.body);
        newPostButton.addEventListener('click', () => {
            NewPostModal.open();
        });
    }
    
    return FeedElement;
}