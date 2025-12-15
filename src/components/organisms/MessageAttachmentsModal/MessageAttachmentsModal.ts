import './MessageAttachmentsModal.css';
import Template from './MessageAttachmentsModal.hbs';
import { FileItem } from '../../atoms/FileItem/FileItem';

export class MessageAttachmentsModal {
  private wrapper: HTMLElement | null = null;
  private files: File[] = [];
  private outsideClickHandler: ((e: MouseEvent) => void) | null = null;

  private onConfirm: ((files: File[]) => void) | null = null;
  private onCancel: (() => void) | null = null;

  open(files: File[], onConfirm: (files: File[]) => void, onCancel?: () => void): void {
    if (this.wrapper) return;

    this.files = [...files];
    this.onConfirm = onConfirm;
    this.onCancel = onCancel ?? null;

    document.body.style.overflow = 'hidden';

    this.render().then(() => {
      const modal = this.wrapper?.querySelector<HTMLElement>('.new-post-modal');
      if (!modal) return;

      if (window.innerWidth <= 768) setTimeout(() => modal.classList.add('open'), 10);
      else modal.classList.add('open');
    });

    this.outsideClickHandler = (event: MouseEvent) => {
      const content = this.wrapper?.querySelector<HTMLElement>('.new-post-container');
      if (content && !content.contains(event.target as Node)) this.close();
    };
    document.addEventListener('mousedown', this.outsideClickHandler);
  }

  private async render(): Promise<void> {
    this.wrapper = document.createElement('div');
    this.wrapper.innerHTML = Template({});

    const fileList = this.wrapper.querySelector<HTMLElement>('.file-list');
    if (fileList) {
      fileList.innerHTML = '';
      this.files.forEach((file) => {
        const item = new FileItem(fileList, {
          file,
          canDelete: true,
          onDelete: () => {
            this.files = this.files.filter((f) => f !== file);
          },
        });
        item.render();
      });
    }

    const cancelBtn = this.wrapper.querySelector<HTMLButtonElement>('.attach-cancel-btn');
    const sendBtn = this.wrapper.querySelector<HTMLButtonElement>('.attach-send-btn');

    cancelBtn?.addEventListener('click', () => {
      this.onCancel?.();
      this.close();
    });

    sendBtn?.addEventListener('click', () => {
      this.onConfirm?.(this.files);
      this.close();
    });

    document.body.appendChild(this.wrapper);
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
}
