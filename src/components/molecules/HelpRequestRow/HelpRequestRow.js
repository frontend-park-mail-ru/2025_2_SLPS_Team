import HelpRequestRowTemplate from './HelpRequestRow.hbs';
import DropDown from '../../atoms/dropDown/dropDown.ts';
import { ApplicationModal } from '../../organisms/ApplicationModal/ApplicationModal.js';
import { NotificationManager } from '../../organisms/NotificationsBlock/NotificationsManager.js';

const notifier = new NotificationManager();

export function mapRequestToViewModel(req, index) {
  const createdAt = req.createdAt ? new Date(req.createdAt) : null;

  const day = createdAt
    ? String(createdAt.getDate()).padStart(2, '0')
    : '';
  const month = createdAt
    ? String(createdAt.getMonth() + 1).padStart(2, '0')
    : '';
  const year = createdAt ? createdAt.getFullYear() : '';

  const createdAtFormatted = createdAt ? `${day}.${month}.${year}` : '';

  let statusText = 'Новый';
  let statusClass = 'help-status--new';

  switch (req.status) {
    case 'closed':
      statusText = 'Закрыто';
      statusClass = 'help-status--closed';
      break;
    case 'in_progress':
      statusText = 'В работе';
      statusClass = 'help-status--in-progress';
      break;
    case 'canceled':
      statusText = 'Отменено';
      statusClass = 'help-status--canceled';
      break;
    default:
      break;
  }

  return {
    id: req.id,
    displayNumber: req.number ?? index + 1,
    topic: req.topic || 'Без темы',
    createdAtFormatted,
    statusText,
    statusClass,
  };
}

export function createHelpRequestRow(req, index, { onEdit, onCancel } = {}) {
  const viewModel = mapRequestToViewModel(req, index);
  const html = HelpRequestRowTemplate(viewModel).trim();

  const tmp = document.createElement('tbody');
  tmp.innerHTML = html;
  const row = tmp.firstElementChild;

  row.addEventListener('click', (event) => {
    if (event.target.closest('.fiend-actions-button')) {
      return;
    }
    const modal = new ApplicationModal(document.body, req);
    modal.open();
  });
  const dropButton = row.querySelector('.fiend-actions-button');
  const actionsContainer = row.querySelector('.friend-actions-container');

  if (dropButton && actionsContainer) {
    const dropdown = new DropDown(actionsContainer, {
      values: [
        {
          label: 'Редактировать',
          icon: '/public/globalImages/EditIcon.svg',
          onClick: () => {
            if (onEdit) {
              onEdit(req);
            } else {
              notifier.show(
                'Редактирование',
                'Редактирование обращения пока не реализовано.',
                'info',
              );
            }
          },
        },
        {
          label: 'Отменить',
          icon: '/public/globalImages/DeleteImg.svg',
          onClick: async () => {
            if (onCancel) {
              await onCancel(req);
            }
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

  return row;
}
