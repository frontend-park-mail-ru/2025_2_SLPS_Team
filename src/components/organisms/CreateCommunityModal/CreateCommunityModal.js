import CreateCommunityModalTemplate from './CreateCommunityModal.hbs';
import './CreateCommunityModal.css';
import BaseInput from '../../atoms/BaseInput/BaseInput.js';
import BaseButton from '../../atoms/BaseButton/BaseButton.js';

export class CreateCommunityModal {
  constructor({ onSubmit, onCancel } = {}) {
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.root = null;
    this.aboutInput = null;
    this.boundEscHandler = this.handleEsc.bind(this);
    this.buttons = [];
  }

  open() {
    if (this.root) return;

    const html = CreateCommunityModalTemplate
      ? CreateCommunityModalTemplate()
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

    this.aboutInput = new BaseInput(this.root.querySelector('.create-community-modal__about-field'),{
      header: 'О Сообществе',
      isBig: true,
      type: 'text',
      placeholder: 'Расскажите о чем ваше сообщество',
      required: true,
    });

    this.aboutInput.render();

    const buttonCountainer = this.root.querySelector('.create-community-modal__footer');
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

    setTimeout(() => {
      this.root.classList.add('open');
    }, 10);


    document.body.appendChild(this.root);
    this.bindEvents();
    this.focusName();
  }

  close() {
    if (!this.root) return;

    this.root.classList.remove('open');

    document.removeEventListener('keydown', this.boundEscHandler);
    this.root.remove();
    this.root = null;
  }

  bindEvents() {
    const overlay = this.root.querySelector('.create-community-modal__overlay');
    const windowEl = this.root.querySelector('.create-community-modal__window');
    const closeBtn = this.root.querySelector('[data-role="close"]');
    const cancelBtn = this.root.querySelector('[data-role="cancel"]');
    const form = this.root.querySelector('.create-community-modal__form');
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
}
