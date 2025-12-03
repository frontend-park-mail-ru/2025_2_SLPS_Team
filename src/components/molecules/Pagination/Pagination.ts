import PaginationTemplate from './Pagination.hbs';

interface PaginationOptions {
  currentPage: number;
  totalPages: number;
  onChange?: (page: number) => void;
}

export function renderPagination(
  container: HTMLElement | null,
  { currentPage, totalPages, onChange }: PaginationOptions
): void {
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => ({
    number: i + 1,
    isActive: i + 1 === currentPage,
  }));

  const html = PaginationTemplate({ pages });
  container.innerHTML = html;

  container
    .querySelectorAll<HTMLButtonElement>('.help-page__page-btn')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = Number(btn.dataset.page);
        if (!Number.isNaN(page) && page !== currentPage && onChange) {
          onChange(page);
        }
      });
    });
}
