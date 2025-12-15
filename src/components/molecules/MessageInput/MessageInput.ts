import MessageInputTemplate from './MessageInput.hbs';
import { EmojiMenu } from '../EmojiMenu/EmojiMenu';

export type MessageInputSendPayload = { text: string; files: File[] };

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

  private files: File[] = [];
  private onSend: ((payload: MessageInputSendPayload) => void | Promise<void>) | null;

  constructor(
    rootElement: HTMLElement,
    onSend?: (payload: MessageInputSendPayload) => void | Promise<void>,
  ) {
    this.rootElement = rootElement;
    this.onSend = onSend ?? null;
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

    if (!textarea || !sendBtn || !emojiBtn || !pickerRoot || !attachBtn || !fileInput) {
      throw new Error('[MessageInput] some elements not found in template');
    }

    this.textarea = textarea;
    this.sendButton = sendBtn;
    this.emojiBtn = emojiBtn;
    this.emojiRoot = pickerRoot;
    this.attachBtn = attachBtn;
    this.fileInput = fileInput;

    this.textarea.addEventListener('input', () => {
      this.textarea.style.height = 'auto';
      this.textarea.style.height = Math.min(this.textarea.scrollHeight, 120) + 'px';
    });

    this.emojiPicker = new EmojiMenu(this.wrapper, (emoji) => this.insertEmoji(emoji));
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
      const list = this.fileInput.files ? Array.from(this.fileInput.files) : [];
      this.files = list;
    });

    this.sendButton.addEventListener('click', () => {
      void this.triggerSend();
    });

    this.textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void this.triggerSend();
      }
    });

    this.rootElement.appendChild(this.wrapper);
  }

  private async triggerSend(): Promise<void> {
    const text = this.getValue().trim();
    const files = this.getFiles();

    if (!text && files.length === 0) return;
    if (!this.onSend) return;

    this.sendButton.disabled = true;
    try {
      await this.onSend({ text, files });
      this.clear();
    } finally {
      this.sendButton.disabled = false;
    }
  }

  getValue(): string {
    return this.textarea ? this.textarea.value : '';
  }

  getFiles(): File[] {
    return this.files;
  }

  clear(): void {
    if (this.textarea) {
      this.textarea.value = '';
      this.textarea.style.height = '37px';
    }
    this.clearFiles();
  }

  clearFiles(): void {
    this.files = [];
    if (this.fileInput) this.fileInput.value = '';
  }

  insertEmoji(emoji: string): void {
    const textarea = this.textarea;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    textarea.value = textarea.value.slice(0, start) + emoji + textarea.value.slice(end);

    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    textarea.dispatchEvent(new Event('input'));
  }
}
