import CreatePostTemplate from './CreatePost.hbs';
import { ImageInput } from '../../molecules/ImageInput/ImageInput';
import BaseButton from '../../atoms/BaseButton/BaseButton';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';
import { EventBus } from '../../../services/EventBus.js';
import {
  processCreatePostData,
  processUpdatePostData,
  SelectedFile,
} from '../../../shared/Submit/createPostSubmit';

const notifier = new NotificationManager();

type CreatePostMode = 'create' | 'edit';

interface CreatePostOptions {
  communityId?: number | null;
}

interface PostData {
  id?: number;
  text?: string;
  photos?: string[];
  communityID?: number | null;
  post?: PostData;
  [key: string]: unknown;
}

export class CreatePostForm {
  private rootElement: HTMLElement;
  private user_id: number | null;
  private wrapper: HTMLElement | null = null;
  private input: ImageInput | null = null;
  private mode: CreatePostMode;
  private postData: PostData | null;
  private communityId: number | null;

  private outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  constructor(
    rootElement: HTMLElement,
    profileData: number | null,
    mode: CreatePostMode = 'create',
    postData: PostData | null = null,
    options: CreatePostOptions = {},
  ) {
    this.rootElement = rootElement;
    this.user_id = profileData ?? null;
    this.mode = mode;
    this.postData = postData;
    this.communityId = options.communityId ?? null;
  }

  async render(): Promise<void> {
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'new-post-wrapper';
    this.wrapper.innerHTML = CreatePostTemplate({});

    const textInput = this.wrapper.querySelector<HTMLInputElement>('.post-text__input');

    if (this.mode === 'edit') {
      const header = this.wrapper.querySelector<HTMLElement>('.new-post__header');
      if (header) header.textContent = 'Редактирование поста';
    }

    const inputContainer =
      this.wrapper.querySelector<HTMLElement>('.input-image__block');

    if (inputContainer) {
      this.input = new ImageInput(inputContainer);
      await this.input.render();
    }

    if (this.mode === 'edit' && this.postData) {
      const text =
        this.postData.post?.text ??
        this.postData.text ??
        '';

      if (textInput) textInput.value = text;

      const photos =
        this.postData.post?.photos ??
        this.postData.photos ??
        [];

      if (Array.isArray(photos) && photos.length > 0 && this.input) {
        this.input.displayExistingImages(photos);
      }
    }

    const buttonContainer =
      this.wrapper.querySelector<HTMLElement>('.new-post-actions__container');

    if (buttonContainer) {
      const cancelBtn = new BaseButton(buttonContainer, {
        text: 'Отменить',
        style: 'default',
        onClick: () => this.close(),
      });
      await cancelBtn.render();

      const mainBtn = new BaseButton(buttonContainer, {
        text: this.mode === 'edit' ? 'Сохранить изменения' : 'Создать пост',
        style: 'primary',
        onClick: () => {
          if (this.mode === 'edit') void this.updatePost();
          else void this.saveData();
        },
      });
      await mainBtn.render();
    }

    this.rootElement.insertAdjacentElement('beforeend', this.wrapper);
  }

  open(): void {
    document.body.style.overflow = 'hidden';

    this.render().then(() => {
      if (!this.wrapper) return;
      const modal = this.wrapper.querySelector<HTMLElement>('.new-post-modal');
      if (!modal) return;

      if (window.innerWidth <= 768) {
        setTimeout(() => modal.classList.add('open'), 10);
      } else {
        modal.classList.add('open');
      }
    });

    this.outsideClickHandler = (event: MouseEvent) => {
      if (!this.wrapper) return;

      const modalContent =
        this.wrapper.querySelector<HTMLElement>('.new-post-container');

      if (modalContent && !modalContent.contains(event.target as Node)) {
        this.close();
      }
    };

    document.addEventListener('mousedown', this.outsideClickHandler);
  }

  close(): void {
    const modal = this.wrapper?.querySelector<HTMLElement>('.new-post-modal');
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

    this.wrapper?.remove();
    this.wrapper = null;
  }

  private getText(): string {
    if (!this.wrapper) return '';
    const input = this.wrapper.querySelector<HTMLInputElement>('.post-text__input');
    return input?.value?.trim() ?? '';
  }

  async saveData(): Promise<void> {
    if (!this.input) return;

    try {
      const text = this.getText();
      const files = (this.input.selectedFiles ?? []) as SelectedFile[];

      if (!files.length) {
        notifier.show('Ошибка', 'Нельзя создать пост без фото', 'error');
        return;
      }

      await processCreatePostData({
        text,
        files,
        communityId: this.communityId,
      });

      notifier.show(
        'Пост создан',
        this.communityId
          ? 'Вы создали пост в сообществе'
          : 'Вы создали пост, можете посмотреть его в профиле',
        'success',
      );

      EventBus.emit('posts:created');

      if (!this.communityId && location.pathname.startsWith('/profile')) {
        EventBus.emit('profile:newPost');
      }

      if (this.communityId) {
        EventBus.emit('community:newPost', { communityId: this.communityId });
      }

      this.close();
    } catch (err) {
      console.error(err);
      notifier.show('Ошибка', 'Не удалось создать пост', 'error');
    }
  }

  async updatePost(): Promise<void> {
    if (!this.input || !this.postData) return;

    try {
      const text = this.getText();
      const selectedFiles = (this.input.selectedFiles ?? []) as SelectedFile[];

      const communityId =
        this.communityId ??
        (this.postData.post?.communityID ?? this.postData.communityID ?? null);

      const postId =
        this.postData.post?.id ??
        this.postData.id;

      if (!postId) {
        notifier.show('Ошибка', 'Не найден ID поста для редактирования', 'error');
        return;
      }

      await processUpdatePostData({
        text,
        selectedFiles,
        communityIdFromPost: communityId,
        postId,
      });

      notifier.show('Пост изменён', 'Изменения успешно сохранены', 'success');

      EventBus.emit('posts:updated');

      if (!communityId && location.pathname.startsWith('/profile')) {
        EventBus.emit('profile:newPost');
      }

      if (communityId) {
        EventBus.emit('community:newPost', { communityId });
      }

      this.close();
    } catch (err) {
      console.error(err);
      notifier.show('Ошибка', 'Не удалось изменить пост', 'error');
    }
  }
}
