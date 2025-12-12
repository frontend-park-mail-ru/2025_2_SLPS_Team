import CreatePostTemplate from './CreatePost.hbs';
import { ImageInput } from '../../molecules/ImageInput/ImageInput';
import BaseButton from '../../atoms/BaseButton/BaseButton';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager';
import { EventBus } from '../../../services/EventBus.js';
import {
  processCreatePostData,
  processUpdatePostData,
  SelectedFile,
} from '../../../shared/Submit/createPostSubmit';
import { FileItem } from '../../atoms/FileItem/FileItem';

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
  attachments?: string[];
}

export class CreatePostForm {
  private rootElement: HTMLElement;
  private user_id: number | null;
  private wrapper: HTMLElement | null = null;
  private input: ImageInput | null = null;
  private mode: CreatePostMode;
  private postData: PostData | null;
  private communityId: number | null;
  private attachments: File[] = [];

  private existingPhotos: string[] = [];

  private suppressAdding = false;

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

  private keyOf(item: File | string) {
    return item instanceof File
      ? `file:${item.name}:${item.size}:${item.lastModified}`
      : `url:${item}`;
  }

  async render(): Promise<void> {
    console.log(this.postData)
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
      const onFileDroppedHandler = (file: File) => {
          this.attachments.push(file);
          this.renderFileList();
      };

      this.input = new ImageInput(inputContainer, {
        onFileDropped: onFileDroppedHandler,
      });
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
        this.suppressAdding = true;
        try {
          this.input.displayExistingImages(photos);
        } finally {
          this.suppressAdding = false;
        }

        this.existingPhotos = photos.slice();
      }
      for (const att of this.postData.attachments || []) {
        const file = await this.downloadUrlAsFile(att);
        if (file) {
          this.attachments.push(file);
        }
      }
      this.renderFileList();
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
    if (this.wrapper) return;

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
        attachments: this.attachments,
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
        attachments: this.attachments,
        communityIdFromPost: communityId,
        postId,
      });

      console.log(this.attachments)

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

  private renderFileList() {
    const container = this.wrapper?.querySelector('.file-list') as HTMLElement;
    if (!container) return;

    container.innerHTML = '';

    this.attachments = this.getUniqueAttachments(this.attachments);
    console.log(this.attachments);

    this.attachments.forEach((fileOrUrl) => {
      const fileComponent = new FileItem(container, {
        file: fileOrUrl instanceof File ? fileOrUrl : undefined,
        fileUrl: typeof fileOrUrl === 'string' ? fileOrUrl : undefined,
        canDelete: true,
        onDelete: () => this.deleteAttachment(fileOrUrl),
      });
      void fileComponent.render();
    });
  }

  private deleteAttachment(file: File) {
      this.attachments = this.attachments.filter(f => f !== file);
      this.renderFileList();
    }

  private async downloadUrlAsFile(url: string): Promise<File | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error("Failed to fetch", url);
        return null;
      }

      const blob = await response.blob();

      const parts = url.split("/");
      const filename = parts[parts.length - 1] || "image.jpg";

      return new File([blob], filename, { type: blob.type });
    } catch (e) {
      console.error("Error downloading", url, e);
      return null;
    }
  }

  private getUniqueAttachments(files: File[]): File[] {
    const map = new Map<string, File>();

    for (const file of files) {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (!map.has(key)) {
        map.set(key, file);
      }
    }

    return Array.from(map.values());
  }

}
