import { renderPost } from "../../molecules/Post/Post.js";
import FeedTemplate from './Feed.hbs'

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
export async function renderFeed(posts){
    const template = FeedTemplate;
    const html = template({icon: "/public/globalImages/NewPostIcon.svg"});

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim()

    const FeedElement = wrapper.firstElementChild;

    for(const postData of posts){
        FeedElement.appendChild(await renderPost(postData));
    }
    return FeedElement;
}