import EditProfileTemplate from './EditProfileForm.hbs';
import BaseInput from '../../atoms/BaseInput/BaseInput';
import SelectInput from '../../atoms/SelectInput/SelectInput';
import DropDown from '../../atoms/dropDown/dropDown';
import BaseButton from '../../atoms/BaseButton/BaseButton';
import { NotificationManager } from '../NotificationsBlock/NotificationsManager';
import { navigateTo } from '../../../app/router/navigateTo.js';
import { layout } from '../../../Pages/LayoutManager';
import { processEditProfileSubmit } from '../../../shared/Submit/editProfileSubmit';
import type { ProfileData } from '../../../shared/types/components';

const notifier = new NotificationManager();

interface EditProfileInputs {
  name?: BaseInput;
  secondName?: BaseInput;
  aboutUser?: BaseInput;
  bthDay?: SelectInput;
  bthMonth?: SelectInput;
  bthYear?: SelectInput;
  gender?: SelectInput;
  Imageinput?: HTMLInputElement;
  preview?: HTMLImageElement;
  overlay?: HTMLElement;
}

export class EditProfileForm {
  private rootElement: HTMLElement;
  private profileData: ProfileData;

  private wrapper: HTMLElement | null = null;
  private inputs: EditProfileInputs = {};

  private editAvatarMenu: DropDown | null = null;
  private defaultAvatar: string = '/public/globalImages/DefaultAvatar.svg';
  private hasCustomAvatar: boolean;
  private avatarDeleted: boolean = false;
  private currentAvatarBlobUrl: string | null = null;

  private outsideClickHandler: ((event: MouseEvent) => void) | null = null;

  constructor(rootElement: HTMLElement, profileData: ProfileData) {
    this.rootElement = rootElement;
    this.profileData = profileData;
    this.hasCustomAvatar = !!profileData.avatarPath;
  }

  async render(): Promise<void> {
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'edit-profile-wrapper';
    this.wrapper.classList.add('edit-profile-modal');
    this.wrapper.innerHTML = EditProfileTemplate({
      AvatarUrl: this.resolveAvatarUrl(this.profileData.avatarPath ?? null),
      profileData: this.profileData,
    });

    this.rootElement.insertAdjacentElement('beforeend', this.wrapper);

    const closeBtn = this.wrapper.querySelector<HTMLElement>('.edit-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    const splitName = this.profileData.fullName.split(' ');
    const firstName = splitName[0] ?? '';
    const lastName = splitName[1] ?? '';

    this.inputs.name = new BaseInput(
      this.wrapper.querySelector('.user-name') as HTMLElement,
      {
        header: 'Имя',
        type: 'text',
        placeholder: 'Имя',
        required: true,
        value: firstName,
      },
    );
    await this.inputs.name.render();

    this.inputs.secondName = new BaseInput(
      this.wrapper.querySelector('.user-name') as HTMLElement,
      {
        header: 'Фамилия',
        type: 'text',
        placeholder: 'Фамилия',
        required: true,
        value: lastName,
      },
    );
    await this.inputs.secondName.render();

    this.inputs.aboutUser = new BaseInput(
      this.wrapper.querySelector('.about-user') as HTMLElement,
      {
        header: 'О себе',
        isBig: true,
        type: 'text',
        placeholder: 'Расскажите о себе',
        required: true,
        value: this.profileData.aboutMyself,
      },
    );
    await this.inputs.aboutUser.render();

    const dob = new Date(this.profileData.dob);
    const dobDay = dob.getUTCDate();
    const dobMonth = dob.getUTCMonth();
    const dobYear = dob.getUTCFullYear();

    const days = Array.from({ length: 31 }, (_, i) => ({
      label: String(i + 1),
      value: String(i + 1),
      active: i + 1 === dobDay,
    }));

    this.inputs.bthDay = new SelectInput(
      this.wrapper.querySelector('.bth-day') as HTMLElement,
      {
        values: days,
        pressedStyle: true,
      },
    );
    await this.inputs.bthDay.render();

    const monthNames = [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ];

    const months = monthNames.map((name, index) => ({
      label: name.slice(0, 3),
      value: name,
      active: index === dobMonth,
    }));

    this.inputs.bthMonth = new SelectInput(
      this.wrapper.querySelector('.bth-month') as HTMLElement,
      {
        values: months,
        pressedStyle: true,
      },
    );
    await this.inputs.bthMonth.render();

    const currentYear = new Date().getFullYear();
    const maxYear = currentYear - 14;

    const years = Array.from({ length: 100 }, (_, i) => {
      const year = maxYear - i;
      return {
        label: String(year),
        value: String(year),
        active: year === dobYear,
      };
    });

    this.inputs.bthYear = new SelectInput(
      this.wrapper.querySelector('.bth-year') as HTMLElement,
      {
        values: years,
        pressedStyle: true,
      },
    );
    await this.inputs.bthYear.render();

    const genderValue = this.profileData.gender;

    this.inputs.gender = new SelectInput(
      this.wrapper.querySelector('.gender-container') as HTMLElement,
      {
        header: 'Пол',
        values: [
          { label: 'Мужской', value: 'Мужской', active: genderValue === 'Мужской' },
          { label: 'Женский', value: 'Женский', active: genderValue === 'Женский' },
        ],
        pressedStyle: true,
      },
    );
    await this.inputs.gender.render();

    this.inputs.Imageinput = this.wrapper.querySelector<HTMLInputElement>(
      '.avatar-upload__input',
    )!;
    this.inputs.preview = this.wrapper.querySelector<HTMLImageElement>(
      '.avatar-upload__image',
    )!;
    this.inputs.overlay = this.wrapper.querySelector<HTMLElement>(
      '.avatar-upload__preview',
    )!;

    this.inputs.overlay.addEventListener('click', () => this.handleAvatarClick());

    this.inputs.Imageinput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (file && this.inputs.preview) {
        const blobUrl = URL.createObjectURL(file);
        this.inputs.preview.src = blobUrl;
        this.hasCustomAvatar = true;
        this.avatarDeleted = false;

        if (this.currentAvatarBlobUrl) {
          URL.revokeObjectURL(this.currentAvatarBlobUrl);
        }
        this.currentAvatarBlobUrl = blobUrl;
      }
    });

    const buttonContainer = this.wrapper.querySelector<HTMLElement>(
      '.form-actions-container',
    );

    if (buttonContainer) {
      const cancelBtn = new BaseButton(buttonContainer, {
        text: 'Отменить',
        style: 'default',
        onClick: () => this.close(),
      });
      await cancelBtn.render();

      const saveBtn = new BaseButton(buttonContainer, {
        text: 'Сохранить',
        style: 'primary',
        onClick: () => void this.saveData(),
      });
      await saveBtn.render();
    }
  }

  private async addEditAvatatarMenu(): Promise<void> {
    if (!this.wrapper) return;

    if (this.editAvatarMenu) {
      this.editAvatarMenu.toggle();
      return;
    }

    const menuRoot = this.wrapper.querySelector<HTMLElement>('.edit-avatar-menu');
    if (!menuRoot) return;

    this.editAvatarMenu = new DropDown(menuRoot, {
      values: [
        {
          label: 'Изменить фото',
          icon: '/public/EditAvatarIcons/AddIcon.svg',
          onClick: () => this.inputs.Imageinput?.click(),
        },
        {
          label: 'Удалить',
          icon: '/public/EditAvatarIcons/DeleteIcon.svg',
          onClick: () => this.deleteAvatar(),
        },
      ],
    });

    await this.editAvatarMenu.render();
    this.editAvatarMenu.show();

    this.outsideClickHandler = (event: MouseEvent) => {
      if (!this.wrapper || !this.editAvatarMenu) return;
      const avatar = this.wrapper.querySelector<HTMLElement>('.avatar-upload');
      if (avatar && !avatar.contains(event.target as Node)) {
        this.editAvatarMenu.hide();
      }
    };

    document.addEventListener('click', this.outsideClickHandler);
  }

  private deleteAvatar(): void {
    if (this.inputs.preview) {
      this.inputs.preview.src = this.defaultAvatar;
    }
    if (this.inputs.Imageinput) {
      this.inputs.Imageinput.value = '';
    }
    this.hasCustomAvatar = false;
    this.avatarDeleted = true;

    if (this.currentAvatarBlobUrl) {
      URL.revokeObjectURL(this.currentAvatarBlobUrl);
      this.currentAvatarBlobUrl = null;
    }
  }

  private handleAvatarClick(): void {
    void this.addEditAvatatarMenu();
  }
  private resolveAvatarUrl(raw?: string | null): string {
    if (!raw || raw === 'null') return this.defaultAvatar;

    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('blob:') || raw.startsWith('data:')) {
      return raw;
    }

    const base = String(process.env.API_BASE_URL || '').replace(/\/+$/, '');

    if (raw.startsWith('/uploads/')) return `${base}${raw}`;
    if (raw.startsWith('uploads/')) return `${base}/${raw}`;
    if (raw.startsWith('/')) return raw;

    return `${base}/uploads/${raw}`;
  }

  open(): void {
    document.body.style.overflow = 'hidden';
    this.render().then(() => {
      if (!this.wrapper) return;
      const modalContainer =
        this.wrapper.querySelector<HTMLElement>('.modal-container');
      if (!modalContainer) return;

      requestAnimationFrame(() => {
        modalContainer.classList.add('open');
      });
    });
  }

  close(): void {
    if (!this.wrapper) return;

    const modalContainer =
      this.wrapper.querySelector<HTMLElement>('.modal-container');
    modalContainer?.classList.remove('open');

    setTimeout(() => {
      document.body.style.overflow = '';

      if (this.editAvatarMenu && this.outsideClickHandler) {
        document.removeEventListener('click', this.outsideClickHandler);
        this.outsideClickHandler = null;
        this.editAvatarMenu = null;
      }

      this.wrapper?.remove();
      this.wrapper = null;
    }, 350);
  }
  

  async saveData(): Promise<void> {
    try {
      const firstName = String(this.inputs.name?.getValue() || '').trim();
      const lastName = String(this.inputs.secondName?.getValue() || '').trim();
      const aboutMyself = String(this.inputs.aboutUser?.getValue() || '').trim();
      const oldDob = new Date(this.profileData.dob);

      const monthNames = [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
      ];

    const rawYear = this.inputs.bthYear?.getValue();
    const rawMonthName = this.inputs.bthMonth?.getValue();
    const rawDay = this.inputs.bthDay?.getValue();

    const year: number =
      rawYear && !Number.isNaN(Number(rawYear))
        ? Number(rawYear)
        : oldDob.getUTCFullYear();

    const monthName = (
      rawMonthName && rawMonthName.length > 0
        ? rawMonthName
        : monthNames[oldDob.getUTCMonth()]
    ) as string;


    const day: number =
      rawDay && !Number.isNaN(Number(rawDay))
        ? Number(rawDay)
        : oldDob.getUTCDate();

    const month = monthNames.indexOf(monthName);

    const dob = new Date(Date.UTC(year, month, day)).toISOString();

      const gender = String(this.inputs.gender?.getValue() || this.profileData.gender);

      const profileJson = { firstName, lastName, aboutMyself, dob, gender };

      const avatarFile =
        this.inputs.Imageinput?.files && this.inputs.Imageinput.files[0]
          ? this.inputs.Imageinput.files[0]
          : null;

      await processEditProfileSubmit({
        profileJson,
        avatarFile,
        avatarDeleted: this.avatarDeleted,
      });

      notifier.show(
        'Изменения сохранены',
        'Изменения в вашем профиле успешно сохранены',
        'success',
      );
      navigateTo(window.location.pathname);
      layout.rerenderLayout();
      this.close();
    } catch (error) {
      console.error(error);
      notifier.show(
        'Изменения не сохранены',
        'Что-то пошло не так, попробуйте позже',
        'error',
      );
    }
  }
}
