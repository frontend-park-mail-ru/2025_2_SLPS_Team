import HelpRequestRowTemplate from './HelpRequestRow.hbs';
import DropDown from '../../atoms/dropDown/dropDown';
import { ApplicationModal } from '../../organisms/ApplicationModal/ApplicationModal';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager';

const notifier = new NotificationManager();

export type HelpRequestStatus = 'closed' | 'in_progress' | 'canceled' | string;

export interface HelpRequestRowData {
  id: number;
  number: number;
  topic: string;
  createdAt: string;
  status: HelpRequestStatus;
  text: string;
  full_name: string;
  emailFeedBack?: string;
}

export interface HelpRequestRowViewModel {
  id: number;
  displayNumber: number;
  topic: string;
  createdAtFormatted: string;
  statusText: string;
  statusClass: string;
}

export interface HelpRequestRowCallbacks {
  onEdit?: (req: HelpRequestRowData) => void;
  onCancel?: (req: HelpRequestRowData) => void | Promise<void>;
}

function formatCreatedAt(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());

  return `${day}.${month}.${year}`;
}

function mapStatus(status: HelpRequestStatus): { statusText: string; statusClass: string } {
  switch (status) {
    case 'closed':
      return { statusText: 'Закрыто', statusClass: 'help-status--closed' };
    case 'in_progress':
      return { statusText: 'В работе', statusClass: 'help-status--in-progress' };
    case 'canceled':
      return { statusText: 'Отменено', statusClass: 'help-status--canceled' };
    default:
      return { statusText: 'Новый', statusClass: 'help-status--new' };
  }
}

export function mapRequestToViewModel(
  req: HelpRequestRowData,
  index: number,
): HelpRequestRowViewModel {
  const createdAtFormatted = formatCreatedAt(req.createdAt);
  const { statusText, statusClass } = mapStatus(req.status);

  return {
    id: req.id,
    displayNumber: req.number ?? index + 1,
    topic: req.topic || 'Без темы',
    createdAtFormatted,
    statusText,
    statusClass,
  };
}

export function createHelpRequestRow(
  req: HelpRequestRowData,
  index: number,
  { onEdit, onCancel }: HelpRequestRowCallbacks = {},
): HTMLTableRowElement {
  const viewModel = mapRequestToViewModel(req, index);
  const html = HelpRequestRowTemplate(viewModel).trim();

  const tmp = document.createElement('tbody');
  tmp.innerHTML = html;

  const row = tmp.firstElementChild;
  if (!(row instanceof HTMLTableRowElement)) {
    throw new Error('[createHelpRequestRow] template root is not <tr>');
  }

  row.addEventListener('click', (event: MouseEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest('.fiend-actions-button')) return;

    const modal = new ApplicationModal(document.body, req as unknown as never);
    modal.open();
  });

  const dropButton = row.querySelector('.fiend-actions-button') as HTMLElement | null;
  const actionsContainer = row.querySelector('.friend-actions-container') as HTMLElement | null;

  if (dropButton && actionsContainer) {
    const dropdown = new DropDown(actionsContainer, {
      values: [
        {
          label: 'Редактировать',
          icon: '/public/globalImages/EditIcon.svg',
          onClick: () => {
            if (onEdit) {
              onEdit(req);
              return;
            }
            notifier.show(
              'Редактирование',
              'Редактирование обращения пока не реализовано.',
              'info',
            );
          },
        },
        {
          label: 'Отменить',
          icon: '/public/globalImages/DeleteImg.svg',
          onClick: async () => {
            if (onCancel) await onCancel(req);
          },
        },
      ],
    });

    dropdown.render();

    const dw = dropdown.wrapper as HTMLElement | null;
    if (dw) {
      dropButton.addEventListener('mouseenter', () => dropdown.show());
      dw.addEventListener('mouseenter', () => dropdown.show());

      dropButton.addEventListener('mouseleave', () => {
        setTimeout(() => {
          if (!dw.matches(':hover')) dropdown.hide();
        }, 50);
      });

      dw.addEventListener('mouseleave', () => dropdown.hide());
    }
  }

  return row;
}
