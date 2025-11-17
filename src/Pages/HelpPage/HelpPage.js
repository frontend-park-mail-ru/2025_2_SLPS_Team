import BasePage from '../BasePage.js';
import HelpPageTemplate from './HelpPage.hbs';
import './HelpPage.css';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager.js';
import DropDown from '../../components/atoms/dropDown/dropDown.js';
import {
  getSupportRequests,
  cancelSupportRequest,
} from '../../shared/api/helpApi.js';

const notifier = new NotificationManager();

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function mapStatus(status) {
  switch (status) {
    case 'closed':
      return { text: 'Закрыто', className: 'help-status--closed' };
    case 'in_progress':
      return { text: 'В работе', className: 'help-status--in-progress' };
    case 'canceled':
      return { text: 'Отменено', className: 'help-status--canceled' };
    case 'new':
    default:
      return { text: 'В работе', className: 'help-status--in-progress' };
  }
}

export class HelpPage extends BasePage {
  constructor(rootElement) {
    super(rootElement);
    this.currentPage = 1;
    this.totalPages = 1;
    this.requests = [];
    this.wrapper = null;
    this.pageEl = null;

    this.isAdmin = false;
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

    await this.fetchUserRole();

    await this.loadPage(this.currentPage);
  }

  async fetchUserRole() {
    try {
      const res = await fetch('/api/auth/isloggedin', {
        method: 'GET',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('Не удалось получить роль пользователя');
        return;
      }

      const data = await res.json();
      this.isAdmin = data.role === 'admin';
    } catch (err) {
      console.error('Ошибка получения роли пользователя', err);
    }
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
        'error'
      );
    }
  }

  renderTableBody() {
    const tbody = this.pageEl.querySelector('.help-table__body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!this.requests.length) {
      const emptyRow = document.createElement('tr');
      emptyRow.className = 'help-table__row';
      emptyRow.innerHTML = `
        <td class="help-table__cell" colspan="5">
          У вас пока нет обращений в поддержку.
        </td>
      `;
      tbody.appendChild(emptyRow);
      return;
    }

    this.requests.forEach((req, index) => {
      const row = document.createElement('tr');
      row.className = 'help-table__row';
      row.dataset.id = req.id;

      const { text: statusText, className: statusClass } = mapStatus(
        req.status
      );

      let actionsCellHtml = '';

      if (this.isAdmin) {
        actionsCellHtml = `
          <div class="friend-card__actions">
            <img
              class="fiend-actions-button"
              src="/public/FriendsActions/MorePointsIcon.svg"
              alt="Действия"
            >
            <div class="friend-actions-container"></div>
          </div>
        `;
      } else {
        actionsCellHtml = '';
      }

      row.innerHTML = `
        <td class="help-table__cell">
          ${req.number ?? index + 1}
        </td>
        <td class="help-table__cell help-table__cell--topic" title="${req.topic || ''}">
          ${req.topic || 'Без темы'}
        </td>
        <td class="help-table__cell">
          ${formatDate(req.createdAt)}
        </td>
        <td class="help-table__cell help-table__cell--status">
          <span class="${statusClass}">${statusText}</span>
        </td>
        <td class="help-table__cell">
          ${actionsCellHtml}
        </td>
      `;

      if (this.isAdmin) {
        const dropButton = row.querySelector('.fiend-actions-button');
        const actionsContainer = row.querySelector('.friend-actions-container');

        if (dropButton && actionsContainer) {
          const dropdown = new DropDown(actionsContainer, {
            values: [
              {
                label: 'Редактировать',
                icon: '/public/globalImages/EditIcon.svg',
                onClick: () => {
                  this.handleEdit(req);
                },
              },
              {
                label: 'Отменить',
                icon: '/public/globalImages/DeleteImg.svg',
                onClick: async () => {
                  await this.handleCancel(req);
                },
              },
            ],
          });

          dropdown.render();

          dropButton.addEventListener('mouseenter', () => dropdown.show());
          dropdown.wrapper.addEventListener('mouseenter', () => dropdown.show());

          dropButton.addEventListener('mouseleave', () => {
            setTimeout(() => {
              if (!dropdown.wrapper.matches(':hover')) dropdown.hide();
            }, 50);
          });

          dropdown.wrapper.addEventListener('mouseleave', () => dropdown.hide());
        }
      }

      tbody.appendChild(row);
    });
  }

  renderPagination() {
    const container = this.pageEl.querySelector('.help-page__pagination');
    if (!container) return;

    container.innerHTML = '';

    if (this.totalPages <= 1) return;

    for (let p = 1; p <= this.totalPages; p++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = String(p);
      btn.className = 'help-page__page-btn';
      if (p === this.currentPage) {
        btn.classList.add('help-page__page-btn--active');
      }

      btn.addEventListener('click', () => {
        if (p !== this.currentPage) {
          this.loadPage(p);
        }
      });

      container.appendChild(btn);
    }
  }

  handleEdit(request) {
    console.log('Edit request', request);
    notifier.show(
      'Редактирование',
      'Редактирование обращения пока не реализовано.',
      'info'
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
        'error'
      );
    }
  }
}
