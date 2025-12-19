import EditCommunityModalTemplate from './EditCommunityModal.hbs';
import './EditCommunityModal.css';

import BaseInput from '../../atoms/BaseInput/BaseInput';
import BaseButton from '../../atoms/BaseButton/BaseButton';
import DropDown from '../../atoms/dropDown/dropDown';

import { NotificationManager } from '../NotificationsBlock/NotificationsManager';
import { updateCommunity, getCommunity } from '../../../shared/api/communityApi';

import type {
  EditCommunityModalOptions,
  EditCommunityInitialFormData,
  EditCommunitySubmitPayload,
  CommunityEntity,
} from '../../../shared/types/components';

import {
  buildUpdateCommunityFormData,
  resolveAvatarPreviewSrc,
} from '../../../shared/Submit/communitySubmit';

const notifier = new NotificationManager();

type ButtonsMap = {
  CancelBtn?: BaseButton;
  SaveBtn?: BaseButton;
};

function mustBeHTMLElement(el: Element | null, selector: string): HTMLElement {
  if (!(el instanceof HTMLElement)) {
    throw new Error(`[EditCommunityModal] Element not found: ${selector}`);
  }
  return el;
}

export class EditCommunityModal {
  private communityId: number | null = null;

  private onSubmit: ((data: EditCommunitySubmitPayload) => void) | undefined;
  private onCancel: (() => void) | undefined;
  private onSuccess: ((freshCommunity: CommunityEntity) => void) | undefined;


  private root: HTMLElement | null = null;
  private aboutInput: BaseInput | null = null;

  private boundEscHandler: (e: KeyboardEvent) => void;

  private buttons: ButtonsMap = {};

  private formData: EditCommunityInitialFormData;

  private avatarInput: HTMLInputElement | null = null;
  private avatarPreview: HTMLImageElement | null = null;
  private avatarOverlay: HTMLElement | null = null;
  private avatarMenuContainer: HTMLElement | null = null;

  private avatarMenu: DropDown | null = null;
  private outsideClickHandler: ((event: MouseEvent) => void) | null = null;

  private readonly defaultAvatar = '/public/globalImages/Avatar.svg';

  private hasCustomAvatar: boolean;
  private avatarDeleted = false;
  private currentAvatarBlob: string | null = null;

  constructor(options: EditCommunityModalOptions = {}) {
    this.communityId = options.communityId ?? null;

    this.onSubmit = options.onSubmit;
    this.onCancel = options.onCancel;
    this.onSuccess = options.onSuccess;

    this.formData = options.FormData ?? {};

    this.hasCustomAvatar = Boolean(this.formData.avatarPath);
    this.boundEscHandler = this.handleEsc.bind(this);
  }

  open(): void {
    if (this.root) return;

    const html = EditCommunityModalTemplate({});
    if (!html) {
      console.error(
        '[EditCommunityModal] Шаблон вернул пустое значение. Проверь import EditCommunityModalTemplate из .hbs',
      );
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const rootEl = wrapper.firstElementChild;
    if (!(rootEl instanceof HTMLElement)) {
      console.error('[EditCommunityModal] Не удалось получить root из шаблона. HTML:', html);
      return;
    }

    this.root = rootEl;

    const aboutMount = mustBeHTMLElement(
      this.root.querySelector('.edit-community-modal__about-field'),
      '.edit-community-modal__about-field',
    );

    this.aboutInput = new BaseInput(aboutMount, {
      header: 'О Сообществе',
      isBig: true,
      type: 'text',
      placeholder: 'Расскажите о чем ваше сообщество',
      required: true,
      value: this.formData.description ?? '',
    });
    this.aboutInput.render();

    const nameInput = this.root.querySelector('#community-name-input');
    if (nameInput instanceof HTMLInputElement) {
      nameInput.value = this.formData.name ?? '';
    }

    const counter = this.root.querySelector('[data-role="name-counter"]');
    if (counter instanceof HTMLElement && nameInput instanceof HTMLInputElement) {
      counter.textContent = `${nameInput.value.length}/48`;
    }

    const buttonContainer = mustBeHTMLElement(
      this.root.querySelector('.edit-community-modal__footer'),
      '.edit-community-modal__footer',
    );

    this.buttons.CancelBtn = new BaseButton(buttonContainer, {
      text: 'Отменить',
      style: 'default',
      onClick: (event: MouseEvent) => {
        event.preventDefault();
        this.handleCancel();
      },
    });
    this.buttons.CancelBtn.render();

    this.buttons.SaveBtn = new BaseButton(buttonContainer, {
      text: 'Сохранить',
      style: 'primary',
      onClick: (event: MouseEvent) => {
        event.preventDefault();
        void this.handleSubmit();
      },
    });
    this.buttons.SaveBtn.render();

    setTimeout(() => {
      this.root?.classList.add('open');
    }, 10);

    const avatarInput = this.root.querySelector('.community-avatar-input');
    this.avatarInput = avatarInput instanceof HTMLInputElement ? avatarInput : null;

    const avatarPreview = this.root.querySelector('.community-avatar-image');
    this.avatarPreview = avatarPreview instanceof HTMLImageElement ? avatarPreview : null;

    const avatarOverlay = this.root.querySelector('.community-avatar-overlay');
    this.avatarOverlay = avatarOverlay instanceof HTMLElement ? avatarOverlay : null;

    const menu = this.root.querySelector('.community-avatar-menu');
    this.avatarMenuContainer = menu instanceof HTMLElement ? menu : null;

    if (this.avatarPreview) {
      this.avatarPreview.src = this.resolveCommunityAvatarUrl(this.formData.avatarPath ?? null);
    }

    if (this.avatarInput) {
      this.avatarInput.addEventListener('change', (e: Event) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;

        const file = target.files?.[0] ?? null;
        if (!file || !this.avatarPreview) return;

        const blob = URL.createObjectURL(file);
        this.avatarPreview.src = blob;

        this.hasCustomAvatar = true;
        this.avatarDeleted = false;

        if (this.currentAvatarBlob) URL.revokeObjectURL(this.currentAvatarBlob);
        this.currentAvatarBlob = blob;
      });
    }

    if (this.avatarOverlay) {
      this.avatarOverlay.addEventListener('click', () => this.toggleAvatarMenu());
    }

    document.body.appendChild(this.root);
    this.bindEvents();
    this.focusName();
  }

  close(): void {
    if (!this.root) return;

    document.removeEventListener('keydown', this.boundEscHandler);
    this.root.remove();
    this.root = null;

    if (this.avatarMenu && this.outsideClickHandler) {
      document.removeEventListener('click', this.outsideClickHandler);
    }

    this.avatarMenu = null;
    this.outsideClickHandler = null;

    if (this.currentAvatarBlob) {
      URL.revokeObjectURL(this.currentAvatarBlob);
      this.currentAvatarBlob = null;
    }
  }

  private bindEvents(): void {
    if (!this.root) return;

    const overlay = this.root.querySelector('.edit-community-modal__overlay');
    const windowEl = this.root.querySelector('.edit-community-modal__window');
    const closeBtn = this.root.querySelector('[data-role="close"]');
    const nameInput = this.root.querySelector('#community-name-input');
    const counter = this.root.querySelector('[data-role="name-counter"]');

    if (overlay instanceof HTMLElement) {
      overlay.addEventListener('click', () => this.handleCancel());
    }

    if (windowEl instanceof HTMLElement) {
      windowEl.addEventListener('click', (e: MouseEvent) => e.stopPropagation());
    }

    if (closeBtn instanceof HTMLElement) {
      closeBtn.addEventListener('click', () => this.handleCancel());
    }

    if (nameInput instanceof HTMLInputElement && counter instanceof HTMLElement) {
      const updateCounter = () => {
        counter.textContent = `${nameInput.value.length}/48`;
      };
      nameInput.addEventListener('input', updateCounter);
      updateCounter();
    }

    document.addEventListener('keydown', this.boundEscHandler);
  }

  private handleEsc(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.handleCancel();
  }

  private handleCancel(): void {
    this.onCancel?.();
    this.close();
  }

  private async handleSubmit(): Promise<void> {
    if (!this.root) return;

    if (this.communityId === null) {
      console.error('[EditCommunityModal] communityId is required');
      return;
    }

    if (!this.aboutInput) return;

    const nameInput = this.root.querySelector('#community-name-input');
    const name = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : '';

    const about = this.aboutInput.getValue();

    if (!name) {
      if (nameInput instanceof HTMLInputElement) nameInput.focus();
      return;
    }

    this.onSubmit?.({ name, about });

    const avatarFile = this.avatarInput?.files?.[0] ?? null;

    const fd = buildUpdateCommunityFormData({
      name,
      description: about,
      avatarFile,
      avatarDeleted: this.avatarDeleted,
    });

    try {
      await updateCommunity(this.communityId, fd);
      const fresh = (await getCommunity(this.communityId)) as CommunityEntity;

      this.onSuccess?.(fresh);

      notifier.show(
        'Изменения сохранены',
        'Изменения в сообществе успешно сохранены',
        'success',
      );

      this.close();
    } catch (error: unknown) {
      console.error(error);
      notifier.show(
        'Изменения не сохранены',
        'Не удалось сохранить изменения сообщества, попробуйте позже',
        'error',
      );
    }
  }

  private focusName(): void {
    const input = this.root?.querySelector('#community-name-input');
    if (!(input instanceof HTMLInputElement)) return;

    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }

  private toggleAvatarMenu(): void {
    if (!this.root) return;

    if (this.avatarMenu) {
      this.avatarMenu.toggle();
      return;
    }

    if (!this.avatarMenuContainer) return;

    this.avatarMenu = new DropDown(this.avatarMenuContainer, {
      values: [
        {
          label: 'Изменить фото',
          icon: '/public/EditAvatarIcons/AddIcon.svg',
          onClick: () => this.avatarInput?.click(),
        },
        {
          label: 'Удалить',
          icon: '/public/EditAvatarIcons/DeleteIcon.svg',
          onClick: () => this.deleteAvatar(),
        },
      ],
    });

    this.avatarMenu.render();
    this.avatarMenu.show();

    this.outsideClickHandler = (event: MouseEvent) => {
      const avatarBlock = this.root?.querySelector('.community-avatar-upload');
      if (!(avatarBlock instanceof HTMLElement)) return;

      if (event.target instanceof Node && !avatarBlock.contains(event.target)) {
        this.avatarMenu?.hide();
      }
    };

    document.addEventListener('click', this.outsideClickHandler);
  }
  private resolveCommunityAvatarUrl(raw?: string | null): string {
    if (!raw || raw === 'null') return this.defaultAvatar;

    if (
      raw.startsWith('http://') ||
      raw.startsWith('https://') ||
      raw.startsWith('blob:') ||
      raw.startsWith('data:')
    ) {
      return raw;
    }

    const base = String(process.env.API_BASE_URL || '').replace(/\/+$/, '');

    return `${base}/uploads/${raw}`;
  }
  private deleteAvatar(): void {
    if (this.avatarPreview) this.avatarPreview.src = this.defaultAvatar;
    if (this.avatarInput) this.avatarInput.value = '';

    this.hasCustomAvatar = false;
    this.avatarDeleted = true;

    if (this.currentAvatarBlob) {
      URL.revokeObjectURL(this.currentAvatarBlob);
      this.currentAvatarBlob = null;
    }
  }
}
