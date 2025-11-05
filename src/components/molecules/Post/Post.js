import { renderPostPhoto } from '../../atoms/PostPhoto/PostPhoto.js';
import { renderIconButton } from '../../atoms/IconButton/IconButton.js';
import PostTemplate from './Post.hbs'
import { authService } from '../../../services/AuthService.js';
import DropDown from '../../atoms/dropDown/dropDown.js';
import { ModalConfirm } from '../ModalConfirm/ModalConfirm.js';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager.js';
import { CreatePostForm } from '../../organisms/CreatePost/CreatePost.js';

const notifier = new NotificationManager();

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
    const isOwner = Number(authService.getUserId()) === postData.authorID;
    const templateData = {
        ...postData,
        isOwner: isOwner
    };

    const html = template(templateData);

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

    const LikeButton = await renderIconButton("/public/IconButtons/LikeButton.svg",postData.likes);
    const CommentButton = await renderIconButton("/public/IconButtons/CommentButton.svg",postData.comments);
    const ShareButton = await renderIconButton("/public/IconButtons/ShareButton.svg",postData.reposts);
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

    if (isOwner) {
        const moreActionsBtn = postElement.querySelector('.post-details-actions-container');
        const postActionsMenu = postElement.querySelector('.post-actions-menu');
        const postActions = new DropDown(postActionsMenu, {
            values: [
                { label: 'Удалить пост', icon: '/public/globalImages/DeleteImg.svg', onClick: () => {
                    console.log('Удаление поста')
                    const blockConfirm = new ModalConfirm(
                        "Подтвердите действие",
                        `Вы уверены что хотите удалить пост?`,
                        async () => {
                            const request = await PostDelete(postData.id);
                            if (request.ok){
                                notifier.show('Пост удален', `Ваш пост успешно удален`, "error")
                            }
                        }
                    );
                    blockConfirm.open();
                } },
                { label: 'Редактировать', icon: '/public/globalImages/EditIcon.svg', onClick: () => {
                    console.log('Тут открываем форму редактирования поста')
                    const editPostFrom = new CreatePostForm(document.body, authService.getUserId(), 'edit', postData);
                    editPostFrom.open();
                } }
            ]
        });

        postActions.render();

        moreActionsBtn.addEventListener('mouseenter', () => postActions.show());
        postActions.wrapper.addEventListener('mouseenter', () => postActions.show());

        moreActionsBtn.addEventListener('mouseleave', () => {
            setTimeout(() => {
                if (!postActions.wrapper.matches(':hover')) postActions.hide();
            }, 0);
        });
        postActions.wrapper.addEventListener('mouseleave', () => postActions.hide());
    }
    
    return postElement
}


async function PostDelete(postId) {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/posts/${postId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                "X-CSRF-Token": authService.getCsrfToken(),
            },
            credentials: 'include',
        });

        return res;
    } catch (error) {
        notifier.show("Ошибка", "Не удалось удалить пост", 'error');
    }
}

