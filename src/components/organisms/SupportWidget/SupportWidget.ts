import './SupportWidget.css';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager';

type SupportWidgetMessage =
  | { type: 'support-widget:close' }
  | { type: 'support-widget:submitted' }
  | { type?: string; [key: string]: unknown };

export class SupportWidget {
  private root: HTMLElement;
  private container: HTMLDivElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private isOpen = false;
  private notifier: NotificationManager | null = null;

  constructor(root: HTMLElement = document.body) {
    this.root = root;
    this.handleMessage = this.handleMessage.bind(this);
  }

  render(): void {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'support-widget';

    this.iframe = document.createElement('iframe');
    this.iframe.className = 'support-widget__iframe';
    this.iframe.src = '/supportform';
    this.iframe.style.display = 'none';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'support-widget__button';
    button.innerHTML = '?';

    button.addEventListener('click', () => this.toggle());

    this.container.appendChild(this.iframe);
    this.container.appendChild(button);
    this.root.appendChild(this.container);

    this.notifier = new NotificationManager();
    this.notifier.init();

    window.addEventListener('message', this.handleMessage);
  }

  private handleMessage(event: MessageEvent<unknown>): void {
    const data = (event.data ?? {}) as SupportWidgetMessage;

    if (data.type === 'support-widget:close') {
      this.hide();
      return;
    }

    if (data.type === 'support-widget:submitted') {
      this.hide();
      this.notifier?.show(
        'Обращение отправлено',
        'Мы получили ваше обращение и скоро свяжемся с вами.',
        'success',
      );
    }
  }

  show(): void {
    this.isOpen = true;
    if (this.iframe) this.iframe.style.display = 'block';
  }

  hide(): void {
    this.isOpen = false;
    if (this.iframe) this.iframe.style.display = 'none';
  }

  toggle(): void {
    this.isOpen ? this.hide() : this.show();
  }

  destroy(): void {
    window.removeEventListener('message', this.handleMessage);

    if (this.container?.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }

    this.container = null;
    this.iframe = null;
    this.notifier = null;
    this.isOpen = false;
  }
}
