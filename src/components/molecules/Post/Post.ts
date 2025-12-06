import { renderPostPhoto } from '../../atoms/PostPhoto/PostPhoto';
import { renderIconButton } from '../../atoms/IconButton/IconButton';
import PostTemplate from './Post.hbs';
import { authService } from '../../../services/AuthService.js';
import DropDown from '../../atoms/dropDown/dropDown';
import { ModalConfirm } from '../ModalConfirm/ModalConfirm';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager.js';
import { CreatePostForm } from '../../organisms/CreatePost/CreatePost.js';
import { EventBus } from '../../../services/EventBus.js';
import { togglePostLike } from '../../../shared/api/postsApi.js';
import { navigateTo } from '../../../app/router/navigateTo.js';
import { Post } from './PostTypes';

const notifier = new NotificationManager();

/**
 * Рендерит пост с фотографиями, кнопками действий и возможностью разворачивания текста.
 *
 * @async
 * @function renderPost
 * @param {Object} postData - Данные поста.
 */
export async function renderPost(rawPostData: Post | Record<string, any>): Promise<HTMLElement | null> {

  let postData: Post = { ...(rawPostData as Post) };

  if (postData.post) {
    const post = postData.post;

    const likes =
      (postData.likes as number | undefined) ??
      (post.likes as number | undefined) ??
      (post.likeCount as number | undefined) ??
      (post.like_count as number | undefined) ??
      0;

    const comments =
      (postData.comments as number | undefined) ??
      (post.comments as number | undefined) ??
      (post.commentCount as number | undefined) ??
      (post.comment_count as number | undefined) ??
      0;

    const reposts =
      (postData.reposts as number | undefined) ??
      (post.reposts as number | undefined) ??
      (post.repostCount as number | undefined) ??
      (post.repost_count as number | undefined) ??
      0;

    const isLiked = (postData.isLiked as boolean | undefined) ?? (post.isLiked as boolean | undefined) ?? false;

    postData = {
      ...post,
      authorID: post.authorID ?? postData.authorID ?? postData.author?.id ?? null,
      authorName: post.authorName ?? postData.authorName ?? postData.author?.fullName ?? '',
      authorAvatar: post.authorAvatar ?? postData.authorAvatar ?? postData.author?.avatarPath ?? null,
      communityID: post.communityID ?? postData.communityID ?? null,
      communityId: post.communityId ?? postData.communityId ?? null,
      communityName: post.communityName ?? postData.communityName ?? postData.community_name ?? null,
      communityAvatar: post.communityAvatar ?? postData.communityAvatar ?? postData.community_avatar ?? null,
      likes,
      comments,
      reposts,
      isLiked,
    };
  } else {
    const likes =
      (postData.likes as number | undefined) ??
      (postData.likeCount as number | undefined) ??
      (postData.like_count as number | undefined) ??
      0;

    const comments =
      (postData.comments as number | undefined) ??
      (postData.commentCount as number | undefined) ??
      (postData.comment_count as number | undefined) ??
      0;

    const reposts =
      (postData.reposts as number | undefined) ??
      (postData.repostCount as number | undefined) ??
      (postData.repost_count as number | undefined) ??
      0;

    const isLiked = (postData.isLiked as boolean | undefined) ?? false;

    postData = {
      ...postData,
      likes,
      comments,
      reposts,
      isLiked,
    };
  }

  const isCommunityPost =
    postData.communityID != null || postData.communityId != null || !!postData.communityName;

  const communityName: string | null =
    (postData.communityName as string | undefined) ?? (postData.community_name as string | undefined) ?? null;

  let communityAvatar: string | null =
    (postData.communityAvatar as string | undefined) ?? (postData.community_avatar as string | undefined) ?? null;

  if (!communityAvatar || communityAvatar === 'null') {
    communityAvatar = null;
  }

  const authorName: string =
    (postData.authorName as string | undefined) ?? (postData.author_name as string | undefined) ?? (postData.author?.fullName as string | undefined) ?? '';

  let authorAvatar: string | null =
    (postData.authorAvatar as string | undefined) ?? (postData.author_avatar as string | undefined) ?? (postData.author?.avatarPath as string | undefined) ?? null;

  if (!authorAvatar || authorAvatar === 'null') {
    authorAvatar = null;
  }

  postData.author = {
    id: (postData.authorID as number | undefined) ?? (postData.author?.id as number | undefined) ?? null,
    fullName: isCommunityPost ? (communityName || authorName || '') : (authorName || communityName || ''),
    avatarPath: isCommunityPost ? communityAvatar : (authorAvatar ?? communityAvatar ?? null),
  };

  const template = PostTemplate as unknown as (data: Record<string, any>) => string;
  const userId = authService.getUserId ? authService.getUserId() : null;
  const isOwner = Number(userId) === Number(postData.authorID);
  const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

  let authorAvatarFinal: string;
  if (!postData.author?.avatarPath || postData.author.avatarPath === 'null') {
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

  const html = template(templateData);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = html.trim();

  const postElement = wrapper.firstElementChild as HTMLElement;
  const postHeader = postElement.querySelector('.post-header') as HTMLElement;
  const communityId =
    postData.communityID ??
    postData.communityId ??
    null;

  const authorId =
    postData.authorID ??
    postData.author?.id ??
    null;

  const avatarNode = postElement.querySelector('.community-avatar') as HTMLElement;
  const nameNode = postElement.querySelector('.community-name') as HTMLElement;

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

  const postFooterRoot = postElement.querySelector('.post-footer') as HTMLElement | null;
  if (!postFooterRoot) return postElement;

  const postFooter = postFooterRoot.querySelector('.post-actions-container') as HTMLElement | null;
  if (!postFooter) return postElement;


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
    postData.comments ?? 0,
  );
  const ShareButton = await renderIconButton(
    '/public/IconButtons/ShareButton.svg',
    postData.reposts ?? 0,
  );

  postFooter.appendChild(LikeButton);
  postFooter.appendChild(CommentButton);
  postFooter.appendChild(ShareButton);

  const likeImg = LikeButton.querySelector('img');
  const likeCountNode = LikeButton.querySelector('.icon-button-counter') as HTMLElement;

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

  function animateLikeChange(direction: string) {
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

  const likeListener = (payload: any) => {
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
      currentIsLiked = prevIsLiked;
      currentLikes = prevLikes;
      updateLikeView();

      notifier.show('Ошибка', 'Не удалось обновить лайк', 'error');
    }
  });

  const text = postElement.querySelector('.js-post-text') as HTMLElement;
  const btn = postElement.querySelector('.js-toggle-btn') as HTMLButtonElement;

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
    ) as HTMLButtonElement;
    const postActionsMenu = postElement.querySelector('.post-actions-menu') as HTMLElement;
    const postActions = new DropDown(postActionsMenu, {
      values: [
        {
          label: 'Удалить пост',
          icon: '/public/globalImages/DeleteImg.svg',
          onClick: () => {
            const blockConfirm = new ModalConfirm(
              'Подтвердите действие',
              `Вы уверены что хотите удалить пост?`,
              async () => {
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
            const editPostFrom = new CreatePostForm(
              document.body,
              Number(authService.getUserId()),
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
    postActions.wrapper?.addEventListener('mouseenter', () => postActions.show());

    moreActionsBtn.addEventListener('mouseleave', () => {
      setTimeout(() => {
        if (!postActions.wrapper?.matches(':hover')) postActions.hide();
      }, 0);
    });
    postActions.wrapper?.addEventListener('mouseleave', () => postActions.hide());
  }

  return postElement;
}

async function PostDelete(postId: number) {
  try {
    const csrfToken = authService.getCsrfToken() ?? undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    };
    const res = await fetch(
      `${process.env.API_BASE_URL}/api/posts/${postId}`,
      {
        method: 'DELETE',
        headers,
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
