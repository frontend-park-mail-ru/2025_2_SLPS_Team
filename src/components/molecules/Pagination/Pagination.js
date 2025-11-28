import PaginationTemplate from './Pagination.hbs';

export function renderPagination(container, { currentPage, totalPages, onChange }) {
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    pages.push({
      number: p,
      isActive: p === currentPage,
    });
  }

  const html = PaginationTemplate({ pages });
  container.innerHTML = html;

  container.querySelectorAll('.help-page__page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const page = Number(btn.dataset.page);
      if (page && page !== currentPage && onChange) {
        onChange(page);
      }
    });
  });
}
