import CreatePostTemplate from './CreatePost.hbs';
import { ImageInput } from '../../molecules/ImageInput/ImageInput.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.ts';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';
import { EventBus } from '../../../services/EventBus.js';
import { createPost, updatePost } from '../../../shared/api/postsApi.js';
import { authService } from '../../../services/AuthService.js';

const notifier = new NotificationManager();

export class CreatePostForm {
  /**
   * @param {HTMLElement} rootElement
   * @param {number|null} profileData  - id пользователя (может быть undefined/null)
   * @param {'create'|'edit'} mode
   * @param {Object|null} postData     - данные поста при редактировании
   * @param {Object} options
   *   - communityId?: number          - если задано, пост создаётся в сообществе
   */
  constructor(
    rootElement,
    profileData,
    mode = 'create',
    postData = null,
    options = {},
  ) {
    this.rootElement = rootElement;
    this.user_id = profileData;
    this.wrapper = null;
    this.input = null;
    this.mode = mode;
    this.postData = postData;

    this.options = options || {};
    this.communityId = this.options.communityId ?? null;

    this.outsideClickHandler = null;
  }

  async render() {
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'new-post-wrapper';
    this.wrapper.innerHTML = CreatePostTemplate();

    const textInput = this.wrapper.querySelector('.post-text__input');

    if (this.mode === 'edit') {
      const header = this.wrapper.querySelector('.new-post__header');
      if (header) header.textContent = 'Редактирование поста';
    }

    const inputContainer = this.wrapper.querySelector('.input-image__block');
    this.input = new ImageInput(inputContainer);
    await this.input.render();

    if (this.mode === 'edit' && this.postData) {
      const text =
        this.postData.post?.text ??
        this.postData.text ??
        '';
      if (textInput) {
        textInput.value = text;
      }

      const photos =
        this.postData.post?.photos ??
        this.postData.photos ??
        [];

      if (Array.isArray(photos) && photos.length > 0) {
        this.input.displayExistingImages(photos);
      }
    }

    const buttonContainer = this.wrapper.querySelector(
      '.new-post-actions__container',
    );

    const cancelButton = new BaseButton(buttonContainer, {
      text: 'Отменить',
      style: 'default',
      onClick: () => this.close(),
    });
    await cancelButton.render();

    const mainButton = new BaseButton(buttonContainer, {
      text: this.mode === 'edit' ? 'Сохранить изменения' : 'Создать пост',
      style: 'primary',
      onClick: () => {
        if (this.mode === 'edit') {
          this.updatePost();
        } else {
          this.saveData();
        }
      },
    });
    await mainButton.render();

    this.rootElement.insertAdjacentElement('beforeend', this.wrapper);
  }

  open() {
    document.body.style.overflow = 'hidden';

    this.render().then(() => {
      const modal = this.wrapper.querySelector('.new-post-modal');

      if (window.innerWidth <= 768 && modal) {
        setTimeout(() => modal.classList.add('open'), 10);
      } else if (modal) {
        modal.classList.add('open');
      }
    });

    this.outsideClickHandler = (event) => {
      const modalContent = this.wrapper.querySelector('.new-post-container');

      if (modalContent && !modalContent.contains(event.target)) {
        this.close();
      }
    };

    document.addEventListener('mousedown', this.outsideClickHandler);
  }

  close() {
    const modal = this.wrapper?.querySelector('.new-post-modal');

    document.body.style.overflow = '';

    if (this.outsideClickHandler) {
      document.removeEventListener('mousedown', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }

    if (window.innerWidth <= 768 && modal) {
      modal.classList.remove('open');

      setTimeout(() => {
        this.wrapper?.remove();
        this.wrapper = null;
      }, 300);

      return;
    }

    if (this.wrapper) {
      this.wrapper.remove();
      this.wrapper = null;
    }
  }

  async saveData() {
    try {
      const textInput = this.wrapper.querySelector('.post-text__input');
      const text = textInput?.value?.trim() ?? '';

      const formData = new FormData();
      formData.append('text', text);

      const hasPhotos =
        this.input &&
        this.input.selectedFiles &&
        this.input.selectedFiles.length > 0;

      if (!hasPhotos) {
        notifier.show('Ошибка', 'Нельзя создать пост без фото', 'error');
        return;
      }

      this.input.selectedFiles.forEach((file) =>
        formData.append('photos', file),
      );

      if (this.communityId) {
        formData.append('communityID', this.communityId);
      }

      await createPost(formData, authService.getCsrfToken());

      if (this.communityId) {
        notifier.show(
          'Пост создан',
          'Вы создали пост в сообществе',
          'success',
        );
      } else {
        notifier.show(
          'Пост создан',
          'Вы создали пост, можете посмотреть его в профиле',
          'success',
        );
      }

      EventBus.emit('posts:created');

      if (!this.communityId && window.location.pathname.startsWith('/profile')) {
        EventBus.emit('profile:newPost');
      }

      if (this.communityId) {
        EventBus.emit('community:newPost', {
          communityId: this.communityId,
        });
      }

      this.close();
    } catch (error) {
      console.log(error);
      notifier.show(
        'Ошибка',
        'Не удалось создать пост. Попробуйте снова.',
        'error',
      );
    }
  }

  async updatePost() {
    try {
      const textInput = this.wrapper.querySelector('.post-text__input');
      const text = textInput?.value?.trim() ?? '';

      const formData = new FormData();
      formData.append('text', text);

      if (
        this.input &&
        this.input.selectedFiles &&
        this.input.selectedFiles.length > 0
      ) {
        for (let file of this.input.selectedFiles) {
          if (file instanceof File) {
            formData.append('photos', file);
          } else if (file.url) {
            const response = await fetch(file.url);
            const blob = await response.blob();
            const filename = file.url.split('/').pop();
            const newFile = new File([blob], filename, { type: blob.type });
            formData.append('photos', newFile);
          }
        }
      }

      const communityIdFromPost =
        this.communityId ??
        this.postData?.post?.communityID ??
        this.postData?.communityID ??
        null;

      if (communityIdFromPost) {
        formData.append('communityID', communityIdFromPost);
      }

      const postId = this.postData.post?.id ?? this.postData.id;

      await updatePost(postId, formData);

      notifier.show('Пост изменён', 'Изменения успешно сохранены', 'success');

      EventBus.emit('posts:updated');

      if (!communityIdFromPost && window.location.pathname.startsWith('/profile')) {
        EventBus.emit('profile:newPost');
      }

      if (communityIdFromPost) {
        EventBus.emit('community:newPost', {
          communityId: communityIdFromPost,
        });
      }

      this.close();
    } catch (error) {
      console.error(error);
      notifier.show(
        'Ошибка',
        'Не удалось изменить пост. Попробуйте снова.',
        'error',
      );
    }
  }
}
