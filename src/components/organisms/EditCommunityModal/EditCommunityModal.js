import EditCommunityModalTemplate from './EditCommunityModal.hbs';
import './EditCommunityModal.css';
import BaseInput from '../../atoms/BaseInput/BaseInput.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.js';
import DropDown from '../../atoms/dropDown/dropDown.js';

export class EditCommunityModal {
  constructor({ onSubmit, onCancel, FormData } = {}) {
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.root = null;
    this.aboutInput = null;
    this.boundEscHandler = this.handleEsc.bind(this);
    this.buttons = [];
    this.FormData = FormData;
    this.avatarInput = null;
    this.avatarPreview = null;
    this.avatarOverlay = null;
    this.avatarMenu = null;
    this.defaultAvatar = '/public/globalImages/DefaultAvatar.svg';
    this.hasCustomAvatar = !!FormData.avatarPath;
    this.avatarDeleted = false;

  }

  open() {
    if (this.root) return;

    const html = EditCommunityModalTemplate
      ? EditCommunityModalTemplate()
      : '';

    if (!html) {
      console.error(
        '[CreateCommunityModal] Шаблон вернул пустое значение. ' +
        'Проверь import CreateCommunityModalTemplate из .hbs'
      );
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    const root = wrapper.firstElementChild;

    if (!root || !(root instanceof Node)) {
      console.error(
        '[CreateCommunityModal] Не удалось получить корневой элемент из шаблона. HTML:',
        html
      );
      return;
    }

    this.root = root;

    this.aboutInput = new BaseInput(this.root.querySelector('.edit-community-modal__about-field'),{
      header: 'О Сообществе',
      isBig: true,
      type: 'text',
      placeholder: 'Расскажите о чем ваше сообщество',
      required: true,
      value: this.FormData.description,
    });

    const nameInput = this.root.querySelector('#community-name-input');
    if (nameInput) {
    nameInput.value = this.FormData.name || '';
    }

    this.aboutInput.render();

    const counter = this.root.querySelector('[data-role="name-counter"]');
    if (counter && nameInput) {
        counter.textContent = `${nameInput.value.length}/48`;
    }

    const buttonCountainer = this.root.querySelector('.edit-community-modal__footer');
    this.buttons.CancelBtn = new BaseButton(buttonCountainer, {
        text: 'Отменить',
        style: 'default',
        onClick: () => {
        this.handleCancel()
        },
    });

    this.buttons.CancelBtn.render()

    this.buttons.SaveBtn = new BaseButton(buttonCountainer, {
        text: 'Сохранить',
        style: 'primary',
        onClick: () => {
        this.handleSubmit();
        },
    })

    this.buttons.SaveBtn.render()

    // ==== АВАТАР СООБЩЕСТВА ====

    this.avatarInput = this.root.querySelector('.community-avatar-input');
    this.avatarPreview = this.root.querySelector('.community-avatar-image');
    this.avatarOverlay = this.root.querySelector('.community-avatar-overlay');
    this.avatarMenuContainer = this.root.querySelector('.community-avatar-menu');

    if (this.avatarPreview && this.FormData.avatarPath) {
        this.avatarPreview.src = this.FormData.avatarPath;
    }

    // загрузка нового файла
    this.avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const blob = URL.createObjectURL(file);
            this.avatarPreview.src = blob;
            this.hasCustomAvatar = true;
            this.avatarDeleted = false;
            this.currentAvatarBlob = blob;
        }
    });

    // открыть меню
    this.avatarOverlay.addEventListener('click', () => this.toggleAvatarMenu());


    document.body.appendChild(this.root);
    this.bindEvents();
    this.focusName();
  }

  close() {
    if (!this.root) return;

    document.removeEventListener('keydown', this.boundEscHandler);
    this.root.remove();
    this.root = null;

    if (this.avatarMenu && this.outsideClickHandler) {
        document.removeEventListener('click', this.outsideClickHandler);
        this.avatarMenu = null;
        this.outsideClickHandler = null;
    }
  }

  bindEvents() {
    const overlay = this.root.querySelector('.edit-community-modal__overlay');
    const windowEl = this.root.querySelector('.edit-community-modal__window');
    const closeBtn = this.root.querySelector('[data-role="close"]');
    const cancelBtn = this.root.querySelector('[data-role="cancel"]');
    const form = this.root.querySelector('.edit-community-modal__form');
    const nameInput = this.root.querySelector('#community-name-input');
    const counter = this.root.querySelector('[data-role="name-counter"]');


    if (overlay) {
      overlay.addEventListener('click', () => this.handleCancel());
    }

    if (windowEl) {
      windowEl.addEventListener('click', (e) => e.stopPropagation());
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.handleCancel());
    }

    if (nameInput && counter) {
      const updateCounter = () => {
        const len = nameInput.value.length;
        counter.textContent = `${len}/48`;
      };
      nameInput.addEventListener('input', updateCounter);
      updateCounter();
    }

    document.addEventListener('keydown', this.boundEscHandler);
  }

  handleEsc(e) {
    if (e.key === 'Escape') {
      this.handleCancel();
    }
  }

  handleCancel() {
    if (this.onCancel) {
      this.onCancel();
    }
    this.close();
  }

  handleSubmit() {
    const nameInput = this.root.querySelector('#community-name-input');
    const name = nameInput ? nameInput.value.trim() : '';

    const about = this.aboutInput.getValue();

    if (!name) {
      if (nameInput) {
        nameInput.focus();
      }
      return;
    }

    if (this.onSubmit) {
      this.onSubmit({ name, about });
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", about);

    const avatarFile = this.avatarInput.files[0];
    if (avatarFile) {
        formData.append("avatar", avatarFile);
    } else if (this.avatarDeleted) {
        formData.append("avatarDelete", "true");
    }


    this.close();
  }

  focusName() {
    const input = this.root.querySelector('#community-name-input');
    if (input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }

  toggleAvatarMenu() {
        if (this.avatarMenu) {
            this.avatarMenu.toggle();
            return;
        }

        this.avatarMenu = new DropDown(this.avatarMenuContainer, {
            values: [
                { 
                    label: 'Изменить фото', 
                    icon: '/public/EditAvatarIcons/AddIcon.svg', 
                    onClick: () => this.avatarInput.click() 
                },
                { 
                    label: 'Удалить', 
                    icon: '/public/EditAvatarIcons/DeleteIcon.svg', 
                    onClick: () => this.deleteAvatar() 
                }
            ]
        });

        this.avatarMenu.render();
        this.avatarMenu.show();

        this.outsideClickHandler = (event) => {
            const avatarBlock = this.root.querySelector('.community-avatar-upload');
            if (avatarBlock && !avatarBlock.contains(event.target)) {
                this.avatarMenu.hide();
            }
        };

        document.addEventListener('click', this.outsideClickHandler);
    }

    deleteAvatar() {
        this.avatarPreview.src = this.defaultAvatar;
        this.avatarInput.value = '';
        this.hasCustomAvatar = false;
        this.avatarDeleted = true;

        if (this.currentAvatarBlob) {
            URL.revokeObjectURL(this.currentAvatarBlob);
            this.currentAvatarBlob = null;
        }
    }

}
