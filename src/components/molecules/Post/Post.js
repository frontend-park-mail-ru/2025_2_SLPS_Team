import { renderPostPhoto } from '../../atoms/PostPhoto/PostPhoto.ts';
import { renderIconButton } from '../../atoms/IconButton/IconButton.ts';
import PostTemplate from './Post.hbs';
import { authService } from '../../../services/AuthService.js';
import DropDown from '../../atoms/dropDown/dropDown.ts';
import { ModalConfirm } from '../ModalConfirm/ModalConfirm.ts';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager.js';
import { CreatePostForm } from '../../organisms/CreatePost/CreatePost.js';
import { EventBus } from '../../../services/EventBus.js';
import { togglePostLike } from '../../../shared/api/postsApi.js';
import { navigateTo } from '../../../app/router/navigateTo.js';

const notifier = new NotificationManager();

/**
 * Рендерит пост с фотографиями, кнопками действий и возможностью разворачивания текста.
 *
 * @async
 * @function renderPost
 * @param {Object} postData - Данные поста.
 */
export async function renderPost(postData) {
  console.log('[renderPost input]', postData);

  if (postData.post) {
    const post = postData.post;

    const likes =
      postData.likes ??
      post.likes ??
      post.likeCount ??
      post.like_count ??
      0;
    const comments =
      postData.comments ??
      post.comments ??
      post.commentCount ??
      post.comment_count ??
      0;
    const reposts =
      postData.reposts ??
      post.reposts ??
      post.repostCount ??
      post.repost_count ??
      0;
    const isLiked = postData.isLiked ?? post.isLiked ?? false;

    postData = {
      ...post,
      authorID:
        post.authorID ??
        postData.authorID ??
        postData.author?.id ??
        null,
      authorName:
        post.authorName ??
        postData.authorName ??
        postData.author?.fullName ??
        '',
      authorAvatar:
        post.authorAvatar ??
        postData.authorAvatar ??
        postData.author?.avatarPath ??
        null,
      communityID: post.communityID ?? postData.communityID ?? null,
      communityId: post.communityId ?? postData.communityId ?? null,
      communityName:
        post.communityName ??
        postData.communityName ??
        postData.community_name ??
        null,
      communityAvatar:
        post.communityAvatar ??
        postData.communityAvatar ??
        postData.community_avatar ??
        null,
      likes,
      comments,
      reposts,
      isLiked,
    };
  } else {
    const likes =
      postData.likes ??
      postData.likeCount ??
      postData.like_count ??
      0;
    const comments =
      postData.comments ??
      postData.commentCount ??
      postData.comment_count ??
      0;
    const reposts =
      postData.reposts ??
      postData.repostCount ??
      postData.repost_count ??
      0;
    const isLiked = postData.isLiked ?? false;

    postData = {
      ...postData,
      likes,
      comments,
      reposts,
      isLiked,
    };
  }

    const isCommunityPost =
    postData.communityID != null ||
    postData.communityId != null ||
    !!postData.communityName;

    const communityName =
    postData.communityName ??
    postData.community_name ??
    null;

    let communityAvatar =
    postData.communityAvatar ??
    postData.community_avatar ??
    null;

    if (!communityAvatar || communityAvatar === 'null') {
    communityAvatar = null;
    }

    const authorName =
    postData.authorName ??
    postData.author_name ??
    postData.author?.fullName ??
    '';

    let authorAvatar =
    postData.authorAvatar ??
    postData.author_avatar ??
    postData.author?.avatarPath ??
    null;

    if (!authorAvatar || authorAvatar === 'null') {
    authorAvatar = null;
    }

    postData.author = {
    id: postData.authorID ?? postData.author?.id ?? null,
    fullName: isCommunityPost
        ? (communityName || authorName || '')
        : (authorName || communityName || ''),
    avatarPath: isCommunityPost
        ? communityAvatar   
        : (authorAvatar ?? communityAvatar ?? null),
    };


  const template = PostTemplate;
  const isOwner = Number(authService.getUserId()) === postData.authorID;
  const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

  let authorAvatarFinal;
  if (!postData.author.avatarPath || postData.author.avatarPath === 'null') {
    authorAvatarFinal = '/public/globalImages/DefaultAvatar.svg';
  } else {
    authorAvatarFinal = `${baseUrl}${postData.author.avatarPath}`;
  }

  const templateData = {
    ...postData,
    isOwner,
    communityAvatar: authorAvatarFinal,
    groupName: postData.author.fullName,
    text: postData.text,
  };

  console.log('[renderPost normalized]', templateData);

  const html = template(templateData);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();

  const postElement = wrapper.firstElementChild;
  const postHeader = postElement.querySelector('.post-header');
  const communityId =
    postData.communityID ??
    postData.communityId ??
    null;

  const authorId =
    postData.authorID ??
    postData.author?.id ??
    null;

  const avatarNode = postElement.querySelector('.community-avatar');
  const nameNode = postElement.querySelector('.community-name');

  function goToOwner() {
    if (communityId) {
      navigateTo(`/community/${communityId}`);
    } else if (authorId) {
      navigateTo(`/profile/${authorId}`);
    }
  }

  [avatarNode, nameNode].forEach((node) => {
    if (!node) return;
    node.style.cursor = 'pointer';
    node.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      goToOwner();
    });
  });
  postData.photos = Array.isArray(postData.photos)
    ? postData.photos
    : postData.imagePath
      ? [postData.imagePath]
      : [];

  const photoElement = await renderPostPhoto(postData.photos);
  postHeader.insertAdjacentElement('afterend', photoElement);

  const postFooter = postElement
    .querySelector('.post-footer')
    .querySelector('.post-actions-container');

  let currentLikes = postData.likes ?? 0;
  let currentIsLiked = !!postData.isLiked;

  const likeIconDefault = '/public/IconButtons/LikeButton.svg';
  const likeIconActive = '/public/IconButtons/ActiveLikeButton.svg';

  const LikeButton = await renderIconButton(
    currentIsLiked ? likeIconActive : likeIconDefault,
    currentLikes,
  );
  const CommentButton = await renderIconButton(
    '/public/IconButtons/CommentButton.svg',
    postData.comments,
  );
  const ShareButton = await renderIconButton(
    '/public/IconButtons/ShareButton.svg',
    postData.reposts,
  );

  postFooter.appendChild(LikeButton);
  postFooter.appendChild(CommentButton);
  postFooter.appendChild(ShareButton);

  const likeImg = LikeButton.querySelector('img');
  const likeCountNode = LikeButton.querySelector('.icon-button-counter');

  function updateLikeView() {
    if (likeImg) {
      likeImg.src = currentIsLiked ? likeIconActive : likeIconDefault;
    }
    if (likeCountNode) {
      likeCountNode.textContent = String(currentLikes);
    }
    if (currentIsLiked) {
      LikeButton.classList.add('icon-button--liked');
    } else {
      LikeButton.classList.remove('icon-button--liked');
    }
  }

  function animateLikeChange(direction) {
    LikeButton.classList.remove('icon-button--bump');
    likeCountNode.classList.remove(
      'icon-button-counter--spin-up',
      'icon-button-counter--spin-down',
    );

    LikeButton.offsetWidth;

    LikeButton.classList.add('icon-button--bump');

    if (direction === 'up') {
      likeCountNode.classList.add('icon-button-counter--spin-up');
    } else if (direction === 'down') {
      likeCountNode.classList.add('icon-button-counter--spin-down');
    }
  }

  updateLikeView();

  const likeListener = (payload) => {
    if (!payload || payload.postId !== postData.id) return;

    currentIsLiked = payload.isLiked;
    currentLikes = payload.likeCount;
    updateLikeView();
  };

  EventBus.on('post:like-changed', likeListener);

  LikeButton.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const prevIsLiked = currentIsLiked;
    const prevLikes = currentLikes;

    try {
      await togglePostLike(postData.id);

      currentIsLiked = !currentIsLiked;
      currentLikes += currentIsLiked ? 1 : -1;
      if (currentLikes < 0) currentLikes = 0;

      let direction = null;
      if (currentLikes > prevLikes) {
        direction = 'up';
      } else if (currentLikes < prevLikes) {
        direction = 'down';
      }

      updateLikeView();

      if (direction) {
        animateLikeChange(direction);
      }

      EventBus.emit('post:like-changed', {
        postId: postData.id,
        isLiked: currentIsLiked,
        likeCount: currentLikes,
      });
    } catch (error) {
      console.error('toggle like error', error);

      currentIsLiked = prevIsLiked;
      currentLikes = prevLikes;
      updateLikeView();

      notifier.show('Ошибка', 'Не удалось обновить лайк', 'error');
    }
  });

  const text = postElement.querySelector('.js-post-text');
  const btn = postElement.querySelector('.js-toggle-btn');

  if (!text || !btn) return postElement;

  requestAnimationFrame(() => {
    const isClamped = text.scrollHeight > text.clientHeight + 1;

    if (!isClamped) {
      btn.style.display = 'none';
      return;
    }

    btn.addEventListener('click', () => {
      text.classList.toggle('expanded');

      if (text.classList.contains('expanded')) {
        text.style.maxHeight = 'none';
        btn.textContent = 'Скрыть';
      } else {
        text.style.maxHeight = '';
        btn.textContent = 'Показать ещё';
      }
    });
  });

  if (isOwner) {
    const moreActionsBtn = postElement.querySelector(
      '.post-details-actions-container',
    );
    const postActionsMenu = postElement.querySelector('.post-actions-menu');
    const postActions = new DropDown(postActionsMenu, {
      values: [
        {
          label: 'Удалить пост',
          icon: '/public/globalImages/DeleteImg.svg',
          onClick: () => {
            console.log('Удаление поста');
            const blockConfirm = new ModalConfirm(
              'Подтвердите действие',
              `Вы уверены что хотите удалить пост?`,
              async () => {
                console.log(postData.id);
                const request = await PostDelete(postData.id);
                if (request?.ok) {
                  notifier.show(
                    'Пост удален',
                    `Ваш пост успешно удален`,
                    'error',
                  );
                  EventBus.emit('posts:deleted');
                }
              },
            );
            blockConfirm.open();
          },
        },
        {
          label: 'Редактировать',
          icon: '/public/globalImages/EditIcon.svg',
          onClick: () => {
            console.log('Тут открываем форму редактирования поста');
            const editPostFrom = new CreatePostForm(
              document.body,
              authService.getUserId(),
              'edit',
              postData,

              {
                communityId:
                  postData.communityID ?? postData.communityId ?? null,
              },
            );
            editPostFrom.open();
          },
        },
      ],
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

  return postElement;
}

async function PostDelete(postId) {
  try {
    const res = await fetch(
      `${process.env.API_BASE_URL}/api/posts/${postId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': authService.getCsrfToken(),
        },
        credentials: 'include',
      },
    );
    if (res.ok) {
      EventBus.emit('posts:deleted');
    }
    return res;
  } catch (error) {
    notifier.show('Ошибка', 'Не удалось удалить пост', 'error');
  }
}
