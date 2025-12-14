import CreateSupportTemplate from './CreateSupportForm.hbs';
import './CreateSupportForm.css';

import BaseButton from '../../atoms/BaseButton/BaseButton';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager';
import SelectInput from '../../atoms/SelectInput/SelectInput';
import BaseInput from '../../atoms/BaseInput/BaseInput';
import { ImageInputSmall } from '../../molecules/InputImageSmall/InputImageSmall';
import { createSupportRequest } from '../../../shared/api/helpApi';

import {
  CATEGORY_MAP,
  type CreateSupportFormInputs,
  type SupportCategoryCode,
  type SupportCategoryLabel,
  type SupportWidgetPostMessage,
} from '../../../shared/types/support';

import { buildSupportPayload, clearErrors, filesToBase64, markError } from '../../../shared/Submit/supportSubmit';


const notifier = new NotificationManager();

function mustBeHTMLElement(el: Element | null, selector: string): HTMLElement {
  if (!(el instanceof HTMLElement)) {
    throw new Error(`[CreateSupportForm] Element not found: ${selector}`);
  }
  return el;
}

function postToParent(message: SupportWidgetPostMessage): void {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(message, '*');
  }
}

export class CreateSupportForm {
  private rootElement: HTMLElement;
  private wrapper: HTMLElement | null = null;

  private outsideClickHandler: ((ev: MouseEvent) => void) | null = null;

  private inputs: Partial<CreateSupportFormInputs> = {};

  constructor(rootElement: HTMLElement) {
    this.rootElement = rootElement;
  }

  async render(): Promise<void> {
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'support-form-wrapper';
    this.wrapper.innerHTML = CreateSupportTemplate({});

    const regEmailMount = mustBeHTMLElement(
      this.wrapper.querySelector('.reg-email-input'),
      '.reg-email-input',
    );

    const supportSelectMount = mustBeHTMLElement(
      this.wrapper.querySelector('.support-select-wrapper'),
      '.support-select-wrapper',
    );

    const aboutProblemMount = mustBeHTMLElement(
      this.wrapper.querySelector('.about-problem-input'),
      '.about-problem-input',
    );

    const nameMount = mustBeHTMLElement(
      this.wrapper.querySelector('.support-contacts-name'),
      '.support-contacts-name',
    );

    const emailMount = mustBeHTMLElement(
      this.wrapper.querySelector('.support-contacts-email'),
      '.support-contacts-email',
    );

    this.inputs.regEmail = new BaseInput(regEmailMount, {
      header: 'С какой почтой вы вошли?',
      type: 'text',
      placeholder: 'exampl@email.com',
      required: true,
    });
    await this.inputs.regEmail.render();

    this.inputs.supportSelect = new SelectInput(supportSelectMount, {
      header: 'С чем связано ваше обращние?',
      values: [
        { label: 'Приложение зависает/тормозит', value: 'Приложение зависает/тормозит', active: false },
        { label: 'Не загружается страница', value: 'Не загружается страница', active: false },
        { label: 'Не работает чат', value: 'Не работает чат', active: false },
        { label: 'Не работает профиль', value: 'Не работает профиль', active: false },
        { label: 'Не работает мессенджер', value: 'Не работает мессенджер', active: false },
        { label: 'Не работает страница друзья', value: 'Не работает страница друзья', active: false },
        { label: 'Проблема с авторизацией/входом', value: 'Проблема с авторизацией/входом', active: false },
        { label: 'Не выбрано', value: 'Не выбрано', active: true },
      ],
    });
    await this.inputs.supportSelect.render();

    this.inputs.aboutProblem = new BaseInput(aboutProblemMount, {
      header: 'Опишите проблему как можно подробнее',
      type: 'text',
      placeholder: 'Тут описание вашей проблемы',
      required: true,
      isBig: true,
    });
    await this.inputs.aboutProblem.render();

    // --- screenshots ---
    const screenshotsWrapper = mustBeHTMLElement(
      this.wrapper.querySelector('.support-screenshot-block'),
      '.support-screenshot-block',
    );

    const imageInputs: ImageInputSmall[] = [];
    (['Фото 1', 'Фото 2', 'Фото 3'] as const).forEach((label) => {
      imageInputs.push(new ImageInputSmall(screenshotsWrapper, label));
    });

    for (const inp of imageInputs) {
      await inp.render();
    }

    this.inputs.imageInputs = imageInputs;

    this.inputs.nameInput = new BaseInput(nameMount, {
      header: 'Имя и Фамилия',
      type: 'text',
      placeholder: 'Укажите как мы можем к вам обращаться',
      required: true,
    });
    await this.inputs.nameInput.render();

    this.inputs.emailInput = new BaseInput(emailMount, {
      header: 'Почта для связи',
      type: 'text',
      placeholder: 'example@email.com',
      required: true,
    });
    await this.inputs.emailInput.render();

    const buttonContainer = mustBeHTMLElement(
      this.wrapper.querySelector('.support-actions__container'),
      '.support-actions__container',
    );

    const cancelButton = new BaseButton(buttonContainer, {
      text: 'Отменить',
      style: 'default',
      onClick: () => this.handleCancel(),
    });
    await cancelButton.render();

    const submitButton = new BaseButton(buttonContainer, {
      text: 'Отправить обращение',
      style: 'primary',
      onClick: () => void this.handleSubmit(),
    });
    await submitButton.render();

    this.rootElement.insertAdjacentElement('beforeend', this.wrapper);
  }

  open(): void {
    document.body.style.overflow = 'hidden';
    void this.render();
  }

  close(): void {
    document.body.style.overflow = '';

    if (this.outsideClickHandler) {
      document.removeEventListener('mousedown', this.outsideClickHandler);
      this.outsideClickHandler = null;
    }

    if (this.wrapper) {
      this.wrapper.remove();
      this.wrapper = null;
    }
  }

  private handleCancel(): void {
    postToParent({ type: 'support-widget:close' });
  }

  private async handleSubmit(): Promise<void> {
    if (!this.wrapper) return;

    const regEmail = this.inputs.regEmail?.getValue().trim() ?? '';
    const topicLabelRaw = this.inputs.supportSelect?.getValue() ?? '';
    const description = this.inputs.aboutProblem?.getValue().trim() ?? '';
    const fullName = this.inputs.nameInput?.getValue().trim() ?? '';
    const contactEmail = this.inputs.emailInput?.getValue().trim() ?? '';

    const loginEmailInput = this.wrapper.querySelector('.support-email-input');
    const topicSelect = this.wrapper.querySelector('.support-topic-select');
    const descriptionInput = this.wrapper.querySelector('.support-description-input');
    const nameInput = this.wrapper.querySelector('.support-name-input');
    const contactEmailInput = this.wrapper.querySelector('.support-contact-email-input');

    clearErrors(this.wrapper);

    let hasError = false;
    const mark = (el: Element | null) => {
      markError(el);
      hasError = true;
    };

    const topicLabel = topicLabelRaw as SupportCategoryLabel;
    const topic: SupportCategoryCode | undefined = (CATEGORY_MAP as Record<string, SupportCategoryCode>)[
      topicLabelRaw
    ];

    if (!regEmail) mark(loginEmailInput);
    if (!topic || topicLabelRaw === 'Не выбрано') mark(topicSelect);
    if (!description) mark(descriptionInput);
    if (!fullName) mark(nameInput);
    if (!contactEmail) mark(contactEmailInput);

    if (hasError) {
      notifier.show('Заполните все поля', 'Все поля формы обязательны для заполнения', 'error');
      return;
    }

    const files: File[] = [];
    const imgs = this.inputs.imageInputs;

    if (Array.isArray(imgs)) {
        for (const input of imgs) {
            const one = input.getImage();
            if (one) files.push(one);
        }
    }

    const base64Images = await filesToBase64(files);

    const payload = buildSupportPayload({
      topic: topic!,
      loginEmail: regEmail,
      contactEmail,
      fullName,
      text: description,
      images: base64Images,
      authorID: 'temp',
    });

    try {
      await createSupportRequest(payload);

      notifier.show(
        'Обращение отправлено',
        'Мы получили ваше обращение и скоро свяжемся с вами.',
        'success',
      );

      postToParent({ type: 'support-widget:submitted' });
    } catch (err: unknown) {
      console.error('[Support] create application failed:', err);

      notifier.show('Ошибка', 'Не удалось отправить обращение. Попробуйте снова.', 'error');
    }
  }
}
