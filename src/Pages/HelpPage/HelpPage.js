import BasePage from '../BasePage.js';

import HelpPageTemplate from './HelpPage.hbs';
import './HelpPage.css';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager.js';

import { createHelpRequestRow } from '../../components/molecules/HelpRequestRow/HelpRequestRow.js';
import { renderPagination } from '../../components/molecules/Pagination/Pagination.js';

import {
  getSupportRequests,
  cancelSupportRequest,
} from '../../shared/api/helpApi.js';

const notifier = new NotificationManager();

export class HelpPage extends BasePage {
  constructor(rootElement) {
    super(rootElement);
    this.currentPage = 1;
    this.totalPages = 1;
    this.requests = [];
    this.wrapper = null;
    this.pageEl = null;
  }

  async render() {
    const existingWrapper = document.getElementById('page-wrapper');
    if (existingWrapper) existingWrapper.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const container = document.createElement('div');
    container.innerHTML = HelpPageTemplate();
    this.pageEl = container.firstElementChild;

    this.wrapper.appendChild(this.pageEl);
    this.rootElement.appendChild(this.wrapper);

    await this.loadPage(this.currentPage);
  }

  async loadPage(page) {
    try {
      const { items, totalPages } = await getSupportRequests(page, 10);
      this.requests = items || [];
      this.totalPages = totalPages || 1;
      this.currentPage = page;

      this.renderTableBody();
      this.renderPagination();
    } catch (err) {
      console.error(err);
      notifier.show(
        'Ошибка',
        'Не удалось загрузить обращения. Попробуйте позже.',
        'error',
      );
    }
  }

  renderTableBody() {
    const tbody = this.pageEl.querySelector('.help-table__body');
    const emptyRow = tbody.querySelector('.help-table__empty-row');

    tbody.querySelectorAll('tr:not(.help-table__empty-row)').forEach((row) => row.remove());

    if (!this.requests.length) {
      emptyRow.classList.remove('help-table__empty-row--hidden');
      return;
    }

    emptyRow.classList.add('help-table__empty-row--hidden');

    this.requests.forEach((req, index) => {
      const row = createHelpRequestRow(req, index, {
        onEdit: (request) => this.handleEdit(request),
        onCancel: (request) => this.handleCancel(request),
      });

      tbody.appendChild(row);
    });
  }


  renderPagination() {
    const container = this.pageEl.querySelector('.help-page__pagination');
    if (!container) return;

    renderPagination(container, {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      onChange: (page) => {
        this.loadPage(page);
      },
    });
  }

  handleEdit(request) {
    console.log('Edit request', request);
    notifier.show(
      'Редактирование',
      'Редактирование обращения пока не реализовано.',
      'warning',
    );
  }

  async handleCancel(request) {
    try {
      const res = await cancelSupportRequest(request.id);

      if (!res.ok) {
        throw new Error('cancel failed');
      }

      notifier.show('Обращение отменено', '', 'success');
      await this.loadPage(this.currentPage);
    } catch (err) {
      console.error(err);
      notifier.show(
        'Ошибка',
        'Не удалось отменить обращение. Попробуйте позже.',
        'error',
      );
    }
  }
}
