import { Notification } from '../../molecules/Notification/Notification';

export class NotificationManager {
  private static instance: NotificationManager | null = null;

  private container: HTMLDivElement | null = null;
  private rootElement!: HTMLElement;
  private notifications: Notification[] = [];

  constructor(rootElement: HTMLElement = document.body) {
    if (NotificationManager.instance) {
      return NotificationManager.instance;
    }

    this.rootElement = rootElement;
    NotificationManager.instance = this;
  }

  public init(): void {
    if (this.container) return;

    const container = document.createElement('div');
    container.classList.add('notification-container');
    this.rootElement.appendChild(container);

    this.container = container;
  }

  public show(text: string, detailsText: string, iconStyle: any): void {
    if (!this.container) {
      this.init();
    }

    const container = this.container;
    if (!container) return;

    const newNotification = new Notification(
      container,
      text,
      detailsText,
      iconStyle,
    );
    newNotification.render();
    this.notifications.push(newNotification);

    if (this.notifications.length > 3) {
      const oldest = this.notifications.shift();
      oldest?.hide();
    }
  }
}