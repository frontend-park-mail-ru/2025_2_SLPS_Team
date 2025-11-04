import { renderPostPhoto } from '../../atoms/PostPhoto/PostPhoto.js';
import { renderIconButton } from '../../atoms/IconButton/IconButton.js';
import PostTemplate from './Post.hbs'

/**
 * Рендерит пост с фотографиями, кнопками действий и возможностью разворачивания текста.
 *
 * @async
 * @function renderPost
 * @param {Object} postData - Данные поста.
 * @param {string} postData.id - Уникальный идентификатор поста.
 * @param {string} postData.author - Автор поста.
 * @param {string} postData.text - Текст поста.
 * @param {Array<string>|string} [postData.photos] - Массив путей к фотографиям или одна фотография (будет преобразована в массив).
 * @param {string} [postData.imagePath] - Альтернативный путь к изображению, если `photos` не задан.
 * @param {number} [postData.like_count=0] - Количество лайков.
 * @returns {Promise<HTMLElement>} Promise, который разрешается в HTML-элемент поста.
 *
 */
export async function renderPost(postData) {
    const template = PostTemplate;

    const html = template(postData);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim()

    const postElement = wrapper.firstElementChild;
    const postHeader = postElement.querySelector(".post-header");
    postData.photos = Array.isArray(postData.photos) 
    ? postData.photos 
    : postData.imagePath ? [postData.imagePath] : [];
    const photoElement = await renderPostPhoto(postData.photos)
    postHeader.insertAdjacentElement("afterend", photoElement);

    const postFooter = postElement.querySelector(".post-footer").querySelector('.post-actions-container');

    const LikeButton = await renderIconButton("./public/IconButtons/LikeButton.svg",postData.likes);
    const CommentButton = await renderIconButton("./public/IconButtons/CommentButton.svg",postData.comments);
    const ShareButton = await renderIconButton("./public/IconButtons/ShareButton.svg",postData.reposts);
    postFooter.appendChild(LikeButton);
    postFooter.appendChild(CommentButton);
    postFooter.appendChild(ShareButton);

    const text = postElement.querySelector(".js-post-text");
    const btn = postElement.querySelector(".js-toggle-btn");

    btn.addEventListener("click", () => {
    text.classList.toggle("expanded");

    if (text.classList.contains("expanded")) {
        btn.textContent = "Скрыть";
    } else {
        btn.textContent = "Показать ещё";
    }
    });
    
    return postElement
}
