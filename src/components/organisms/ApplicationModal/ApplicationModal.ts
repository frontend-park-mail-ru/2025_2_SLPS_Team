import ApplicationModalTemplate from './ApplicationModal.hbs';
import './ApplicationModal.css';

import SelectInput from '../../atoms/SelectInput/SelectInput';
import BaseButton from '../../atoms/BaseButton/BaseButton';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager.js';

import type { SelectInputConfig } from '../../../shared/types/components';
import {
  prepareApplicationStatus,
  type ApplicationData,
} from '../../../shared/Submit/applicationSubmit';

const notifier = new NotificationManager();

interface ApplicationModalOptions {
}

export class ApplicationModal {
  private rootElement: HTMLElement;
  private data: ApplicationData;

  private wrapper: HTMLElement | null;
  private statusSelect: SelectInput | null;
  private outsideClickHandler: ((event: MouseEvent) => void) | null;

  constructor(rootElement: HTMLElement, applicationData: ApplicationData, _options: ApplicationModalOptions = {}) {
    this.rootElement = rootElement;
    this.data = applicationData;

    this.wrapper = null;
    this.statusSelect = null;
    this.outsideClickHandler = null;
  }

  private async render(): Promise<void> {
    if (this.wrapper) {
      this.wrapper.remove();
      this.wrapper = null;
    }

    const wrapper = document.createElement('div');
    wrapper.classList.add('application-modal-wrapper');
    wrapper.innerHTML = ApplicationModalTemplate({});
    this.wrapper = wrapper;

    const container = wrapper.querySelector<HTMLElement>('.application-container');
    if (!container) {
      console.error('[ApplicationModal] Не найден .application-container');
      return;
    }

    const nameEl = container.querySelector<HTMLElement>('.user-first-name');
    const emailEl = container.querySelector<HTMLElement>('.user-email');
    const topicEl = container.querySelector<HTMLElement>('.user-topic');
    const descEl = container.querySelector<HTMLElement>('.user-description');

    if (nameEl) nameEl.textContent = this.data.full_name;
    if (emailEl) emailEl.textContent = this.data.emailFeedBack;
    if (topicEl) topicEl.textContent = this.data.topic;
    if (descEl) descEl.textContent = this.data.text;

    const imgBox = container.querySelector<HTMLElement>('.application-images');
    const viewer = wrapper.querySelector<HTMLElement>('.image-viewer');
    const viewerImg = viewer?.querySelector<HTMLImageElement>('.image-viewer-img');

    if (imgBox && viewer && viewerImg && this.data.images?.length) {
      this.data.images.forEach((src) => {
        const div = document.createElement('div');
        div.classList.add('application-image-item');

        const img = document.createElement('img');
        img.src = src;
        img.alt = 'image';

        img.addEventListener('click', () => {
          viewer.classList.add('image-viewer--open');
          viewerImg.src = src;
        });

        div.appendChild(img);
        imgBox.appendChild(div);
      });

      viewer.addEventListener('click', () => {
        viewer.classList.remove('image-viewer--open');
        viewerImg.src = '';
      });

      viewerImg.addEventListener('click', (e) => e.stopPropagation());
    }

    const statusContainer = container.querySelector<HTMLElement>('.application-status-select');
    if (statusContainer) {
      const config: SelectInputConfig = {
        header: 'Статус',
        placeholder: 'Выберите статус',
        required: true,
        value: 'Открыто',
        values: [
          { label: 'Открыто', value: 'Открыто', active: true },
          { label: 'В работе', value: 'В работе', active: false },
          { label: 'Закрыто', value: 'Закрыто', active: false },
          { label: 'Отменено', value: 'Отменено', active: false },
        ] as any,
        pressedStyle: false,
      };

      this.statusSelect = new SelectInput(statusContainer, config);
      await this.statusSelect.render();
    }

    const buttonContainer = wrapper.querySelector<HTMLElement>('.application-actions');
    if (buttonContainer) {
      const cancelButton = new BaseButton(buttonContainer, {
        text: 'Отменить',
        style: 'default',
        onClick: () => this.close(),
      });
      await cancelButton.render();

      const saveButton = new BaseButton(buttonContainer, {
        text: 'Сохранить',
        style: 'primary',
        onClick: () => this.save(),
      });
      await saveButton.render();
    }

    this.outsideClickHandler = (e: MouseEvent) => {
      if (!this.wrapper) return;
      const modal = this.wrapper.querySelector('.application-container');
      if (modal && !modal.contains(e.target as Node)) {
        this.close();
      }
    };

    wrapper.addEventListener('click', this.outsideClickHandler);
    this.rootElement.appendChild(wrapper);
  }

  open(): void {
    document.body.style.overflow = 'hidden';
    void this.render();
  }

  close(): void {
    document.body.style.overflow = '';

    if (this.wrapper) {
      if (this.outsideClickHandler) {
        this.wrapper.removeEventListener('click', this.outsideClickHandler);
      }
      this.wrapper.remove();
    }

    this.wrapper = null;
    this.statusSelect = null;
    this.outsideClickHandler = null;
  }

  private async save(): Promise<void> {
    try {
      const statusRaw = this.statusSelect?.getValue() ?? '';
      const payload = prepareApplicationStatus(statusRaw, this.data);

      if (!payload) {
        notifier.show('Ошибка', 'Некорректный статус заявки', 'error');
        return;
      }

      console.log('Тут обращаемся к api для изменения статуса заявки', payload);

      notifier.show('Успешно', 'Статус обновлён', 'success');
      this.close();
    } catch (err) {
      console.error(err);
      notifier.show('Ошибка', 'Не удалось сохранить изменения', 'error');
    }
  }
}
