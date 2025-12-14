import BasePage from '../BasePage';

import HelpPageTemplate from './HelpPage.hbs';
import './HelpPage.css';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager';

import { createHelpRequestRow, HelpRequestRowData } from '../../components/molecules/HelpRequestRow/HelpRequestRow';
import { renderPagination } from '../../components/molecules/Pagination/Pagination';

import {
  getSupportRequests,
  cancelSupportRequest,
} from '../../shared/api/helpApi';

import type { SupportRequestItem } from '../../shared/api/helpApi';

const notifier = new NotificationManager();

export class HelpPage extends BasePage {
  private currentPage = 1;
  private totalPages = 1;
  private requests: SupportRequestItem[] = [];

  private wrapper: HTMLDivElement | null = null;
  private pageEl: HTMLElement | null = null;

  constructor(rootElement: HTMLElement) {
    super(rootElement);
  }

  async render(): Promise<void> {
    const existingWrapper = document.getElementById('page-wrapper');
    if (existingWrapper) existingWrapper.remove();

    this.wrapper = document.createElement('div');
    this.wrapper.id = 'page-wrapper';

    const container = document.createElement('div');
    container.innerHTML = HelpPageTemplate({});

    const first = container.firstElementChild;
    if (!(first instanceof HTMLElement)) return;

    this.pageEl = first;

    this.wrapper.appendChild(this.pageEl);
    this.rootElement.appendChild(this.wrapper);

    await this.loadPage(this.currentPage);
  }

  private async loadPage(page: number): Promise<void> {
    if (!this.pageEl) return;

    try {
      const { items, totalPages } = await getSupportRequests(page, 10);
      this.requests = (items ?? []) as HelpRequestRowData[];
      this.totalPages = totalPages ?? 1;
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

  private renderTableBody(): void {
    if (!this.pageEl) return;

    const tbody = this.pageEl.querySelector('.help-table__body') as HTMLElement | null;
    if (!tbody) return;

    const emptyRow = tbody.querySelector('.help-table__empty-row') as HTMLElement | null;

    tbody
      .querySelectorAll('tr:not(.help-table__empty-row)')
      .forEach((row) => row.remove());

    if (!this.requests.length) {
      emptyRow?.classList.remove('help-table__empty-row--hidden');
      return;
    }

    emptyRow?.classList.add('help-table__empty-row--hidden');

    this.requests.forEach((req, index) => {
      const row = createHelpRequestRow(req, index, {
        onEdit: (request: SupportRequestItem) => this.handleEdit(request),
        onCancel: (request: SupportRequestItem) => void this.handleCancel(request),
      });

      if (row instanceof Node) {
        tbody.appendChild(row);
      }
    });
  }

  private renderPagination(): void {
    if (!this.pageEl) return;

    const container = this.pageEl.querySelector('.help-page__pagination') as HTMLElement | null;
    if (!container) return;

    renderPagination(container, {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      onChange: (page: number) => {
        void this.loadPage(page);
      },
    });
  }

  private handleEdit(request: SupportRequestItem): void {
    console.log('Edit request', request);
    notifier.show(
      'Редактирование',
      'Редактирование обращения пока не реализовано.',
      'warning',
    );
  }

  private async handleCancel(request: SupportRequestItem): Promise<void> {
    try {
      await cancelSupportRequest(request.id);

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

async function getSupportRequests_toggleSafe(
  page: number,
  limit: number,
): Promise<{ items: SupportRequestItem[]; totalPages: number }> {
  const res = await getSupportRequests(page, limit);
  return {
    items: (res as any).items ?? [],
    totalPages: (res as any).totalPages ?? 1,
  };
}
