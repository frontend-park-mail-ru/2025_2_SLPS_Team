import CreateCommunityModalTemplate from './CreateCommunityModal.hbs';
import './CreateCommunityModal.css';

import BaseInput from '../../atoms/BaseInput/BaseInput';
import type { BaseInputConfig } from '../../../shared/types/components';
import { processCommunityFormData } from '../../../shared/Submit/communitySubmit';

interface CreateCommunityModalProps {
  onSubmit?: (data: { name: string; about: string }) => void;
  onCancel?: () => void;
}

export class CreateCommunityModal {
  private root: HTMLElement | null = null;
  private aboutInput: BaseInput | null = null;
  private buttons: HTMLElement | null = null;

  private onSubmitFn: (data: { name: string; about: string }) => void;
  private onCancelFn: () => void;

  private boundEscHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor({ onSubmit, onCancel }: CreateCommunityModalProps = {}) {
    this.onSubmitFn = onSubmit ?? (() => {});
    this.onCancelFn = onCancel ?? (() => {});
  }

  async open(): Promise<void> {
    if (this.root) {
      this.close();
    }

    const wrapper = document.createElement('div');
    const html = CreateCommunityModalTemplate ? CreateCommunityModalTemplate({}) : '';

    if (!html) {
      console.error(
        '[CreateCommunityModal] Шаблон вернул пустое значение. Проверь import CreateCommunityModalTemplate',
      );
    }

    wrapper.innerHTML = html;

    const root = wrapper.firstElementChild as HTMLElement | null;
    if (!root) {
      console.error(
        '[CreateCommunityModal] Не удалось получить корневой элемент из шаблона',
      );
      return;
    }

    this.root = root;

    // поле "Описание сообщества"
    const aboutField = root.querySelector<HTMLElement>(
      '.create-community-modal__about-field',
    );
    if (aboutField) {
      const config: BaseInputConfig = {
        header: 'Описание сообщества',
        type: 'text',
        placeholder: 'Опишите сообщество',
        autocomplete: 'off',
        maxLength: 256,
        isBig: true,
        required: false,
      };
      this.aboutInput = new BaseInput(aboutField, config);
      await this.aboutInput.render();
    }

    // счётчик символов имени
    const nameInput = root.querySelector<HTMLInputElement>('#community-name-input');
    const counter = root.querySelector<HTMLElement>(
      '.create-community-modal__name-counter',
    );
    if (nameInput && counter) {
      const updateCounter = () => {
        const len = nameInput.value.length;
        counter.textContent = `${len}/48`;
      };
      nameInput.addEventListener('input', updateCounter);
      updateCounter();
    }

    this.buttons = root.querySelector<HTMLElement>(
      '.create-community-modal__footer',
    );

    const overlay = root.querySelector<HTMLElement>('.create-community-modal__overlay');
    const windowEl = root.querySelector<HTMLElement>('.create-community-modal__window');
    const closeBtn = root.querySelector<HTMLElement>(
      '.create-community-modal__close-button',
    );
    const form = root.querySelector<HTMLFormElement>('.create-community-modal__form');

    if (overlay) {
      overlay.addEventListener('click', () => this.handleCancel());
    }
    if (windowEl) {
      windowEl.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleCancel());
    }
    if (form) {
      form.addEventListener('submit', (e: Event) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }

    document.body.appendChild(root);

    this.boundEscHandler = (e: KeyboardEvent) => this.handleEsc(e);
    document.addEventListener('keydown', this.boundEscHandler);

    this.focusName();
  }

  close(): void {
    if (this.boundEscHandler) {
      document.removeEventListener('keydown', this.boundEscHandler);
    }
    this.boundEscHandler = null;

    if (this.root && this.root.parentElement) {
      this.root.parentElement.removeChild(this.root);
    }

    this.root = null;
    this.aboutInput = null;
    this.buttons = null;
  }

  private handleEsc(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.handleCancel();
    }
  }

  private handleCancel(): void {
    this.close();
    // тут уже всегда есть функция
    this.onCancelFn();
  }

  private handleSubmit(): void {
    if (!this.root) return;

    const nameInput = this.root.querySelector<HTMLInputElement>('#community-name-input');
    const nameValue = nameInput ? nameInput.value : '';
    const aboutValue = this.aboutInput?.getValue() ?? '';

    const processed = processCommunityFormData(nameValue, aboutValue);

    if (!processed) {
      if (nameInput) {
        nameInput.focus();
      }
      return;
    }

    this.onSubmitFn(processed);
    this.close();
  }

  private focusName(): void {
    if (!this.root) return;
    const nameInput = this.root.querySelector<HTMLInputElement>('#community-name-input');
    nameInput?.focus();
  }
}
