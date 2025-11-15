import './SupportWidget.css';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';

export class SupportWidget {
  constructor(root = document.body) {
    this.root = root;
    this.container = null;
    this.iframe = null;
    this.isOpen = false;
    this.notifier = null;

    this.handleMessage = this.handleMessage.bind(this);
  }

  render() {
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

    button.addEventListener('click', () => {
      this.toggle();
    });

    this.container.appendChild(this.iframe);
    this.container.appendChild(button);

    this.root.appendChild(this.container);

    // Инициализируем нотификатор один раз
    this.notifier = new NotificationManager();
    this.notifier.init();

    // Слушаем сообщения из iframe
    window.addEventListener('message', this.handleMessage);
  }

  handleMessage(event) {
    const data = event.data || {};

    if (data.type === 'support-widget:close') {
      // Отмена из формы
      this.hide();
    }

    if (data.type === 'support-widget:submitted') {
      // Успешная отправка из формы
      this.hide();
      if (this.notifier) {
        this.notifier.show(
          'Обращение отправлено',
          'Мы получили ваше обращение и скоро свяжемся с вами.',
          'success'
        );
      }
    }
  }

  show() {
    this.isOpen = true;
    if (this.iframe) {
      this.iframe.style.display = 'block';
    }
  }

  hide() {
    this.isOpen = false;
    if (this.iframe) {
      this.iframe.style.display = 'none';
    }
  }

  toggle() {
    if (this.isOpen) {
      this.hide();
    } else {
      this.show();
    }
  }
}
