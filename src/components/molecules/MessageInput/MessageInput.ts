import MessageInputTemplate from './MessageInput.hbs';
import { EmojiMenu } from '../EmojiMenu/EmojiMenu';
import { FileItem } from '../../atoms/FileItem/FileItem';

export class MessageInput {
  rootElement: HTMLElement;
  wrapper!: HTMLElement;
  textarea!: HTMLTextAreaElement;
  sendButton!: HTMLButtonElement;

  emojiPicker!: EmojiMenu;
  emojiBtn!: HTMLButtonElement;
  emojiRoot!: HTMLElement;

  attachBtn!: HTMLButtonElement;
  fileInput!: HTMLInputElement;

  private previewRoot!: HTMLElement;
  private previewGrid!: HTMLElement;
  private previewFiles!: HTMLElement;

  private pendingFiles: File[] = [];
  private objectUrls: string[] = [];

  public onStickerSelect: ((stickerId: number) => void) | null = null;

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
  }

  render(): void {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = MessageInputTemplate({});
    const root = tempDiv.firstElementChild as HTMLElement | null;
    if (!root) throw new Error('[MessageInput] template root not found');
    this.wrapper = root;

    const textarea = this.wrapper.querySelector('.input-message') as HTMLTextAreaElement | null;
    const sendBtn = this.wrapper.querySelector('.message-send-btn') as HTMLButtonElement | null;
    const emojiBtn = this.wrapper.querySelector('.emoji-btn') as HTMLButtonElement | null;
    const pickerRoot = this.wrapper.querySelector('.emoji-picker') as HTMLElement | null;
    const attachBtn = this.wrapper.querySelector('.message-attach-btn') as HTMLButtonElement | null;
    const fileInput = this.wrapper.querySelector('.message-file-input') as HTMLInputElement | null;

    const previewRoot = this.wrapper.querySelector('.attachments-preview') as HTMLElement | null;
    const previewGrid = this.wrapper.querySelector('.attachments-preview-grid') as HTMLElement | null;
    const previewFiles = this.wrapper.querySelector('.attachments-preview-files') as HTMLElement | null;

    if (!textarea || !sendBtn || !emojiBtn || !pickerRoot || !attachBtn || !fileInput) {
      throw new Error('[MessageInput] some elements not found in template');
    }
    if (!previewRoot || !previewGrid || !previewFiles) {
      throw new Error('[MessageInput] attachments preview elements not found in template');
    }

    this.textarea = textarea;
    this.sendButton = sendBtn;
    this.emojiBtn = emojiBtn;
    this.emojiRoot = pickerRoot;
    this.attachBtn = attachBtn;
    this.fileInput = fileInput;

    this.previewRoot = previewRoot;
    this.previewGrid = previewGrid;
    this.previewFiles = previewFiles;

    this.textarea.addEventListener('input', () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
    });

    this.emojiPicker = new EmojiMenu(
      this.wrapper,
      (emoji) => this.insertEmoji(emoji),
      (stickerId) => this.onStickerSelect?.(stickerId),
    );

    this.emojiPicker.render();

    this.emojiBtn.addEventListener('click', () => this.emojiPicker.toggle());

    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const clickedInside = this.wrapper.contains(target);
      const clickedEmojiBtn = this.emojiBtn.contains(target);
      if (!clickedInside && !clickedEmojiBtn) this.emojiPicker.hide();
    });

    this.attachBtn.addEventListener('click', () => this.fileInput.click());

    this.fileInput.addEventListener('change', () => {
      this.pendingFiles = this.fileInput.files ? Array.from(this.fileInput.files) : [];
      this.renderPreview();
    });

    this.rootElement.appendChild(this.wrapper);

    this.renderPreview();
  }

  getValue(): string {
    return this.textarea ? this.textarea.value : '';
  }

  getFiles(): File[] {
    return this.pendingFiles;
  }

  clear(): void {
    if (this.textarea) {
      this.textarea.value = '';
      this.textarea.style.height = '37px';
    }
    this.clearFiles();
  }

  clearFiles(): void {
    this.pendingFiles = [];
    this.syncInputFiles();
    this.renderPreview();
  }

  private isImage(file: File) {
    return file.type.startsWith('image/');
  }

  private renderPreview() {
    this.revokeUrls();

    this.previewGrid.innerHTML = '';
    this.previewFiles.innerHTML = '';

    if (!this.pendingFiles.length) {
      this.previewRoot.classList.remove('visible');
      return;
    }

    this.previewRoot.classList.add('visible');

    const images = this.pendingFiles.filter((f) => this.isImage(f));
    const otherFiles = this.pendingFiles.filter((f) => !this.isImage(f));

    images.forEach((file) => {
      const url = URL.createObjectURL(file);
      this.objectUrls.push(url);

      const item = document.createElement('div');
      item.className = 'preview-thumb';

      const img = document.createElement('img');
      img.src = url;

      const btn = document.createElement('button');
      btn.className = 'preview-remove';
      btn.type = 'button';
      btn.textContent = '×';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.removeFile(file);
      });

      item.append(img, btn);
      this.previewGrid.appendChild(item);
    });

    otherFiles.forEach((file) => {
      const wrap = document.createElement('div');
      this.previewFiles.appendChild(wrap);

      const fi = new FileItem(wrap, {
        file,
        canDelete: true,
        onDelete: () => this.removeFile(file),
      });

      void fi.render();
    });
  }

  private removeFile(file: File) {
    this.pendingFiles = this.pendingFiles.filter((f) => f !== file);
    this.syncInputFiles();
    this.renderPreview();
  }

  private syncInputFiles() {
    const dt = new DataTransfer();
    this.pendingFiles.forEach((f) => dt.items.add(f));
    this.fileInput.files = dt.files;
    if (!this.pendingFiles.length) this.fileInput.value = '';
  }

  private revokeUrls() {
    this.objectUrls.forEach((u) => URL.revokeObjectURL(u));
    this.objectUrls = [];
  }

  insertEmoji(emoji: string) {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value = textarea.value.slice(0, start) + emoji + textarea.value.slice(end);

    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    textarea.dispatchEvent(new Event('input'));
  }
}
