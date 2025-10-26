import FriendCardTemplate from './FriendCard.hbs';
import './FriendCard.css';

export function renderFriendCard(context = {}) {
    const {
        id,
        name = 'Имя пользователя',
        age = 0,
        condition = 'Статус странички',
        avatarSrc = null,
        listType = 'friends'
    } = context;

    // Определяем тип списка для шаблона
    const isFriendsList = listType === 'friends';
    const isSubscribersList = listType === 'subscribers';
    const isBlockedList = listType === 'blocked';

    const wrapper = document.createElement('div');
    wrapper.innerHTML = FriendCardTemplate({
        id,
        avatarSrc,
        name,
        age,
        condition,
        isFriendsList,
        isSubscribersList,
        isBlockedList
    });
    
    const card = wrapper.firstElementChild;

    // Добавляем обработчики в зависимости от типа списка
    if (isFriendsList) {
        // Обработчики для выпадающего меню друзей
        const button = card.querySelector('.dropdown-button');
        const menu = card.querySelector('.dropdown-menu-sett');
        const buttonIcon = card.querySelector('.dropdown-button-icon');

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('dropdown-menu--open');
            buttonIcon.classList.toggle('dropdown-button-icon--open');
        });

        const menuItems = card.querySelectorAll('.dropdown-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.dataset.action;
                handleMenuAction(action, id, name, listType);
                menu.classList.remove('dropdown-menu--open');
                buttonIcon.classList.remove('dropdown-button-icon--open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!card.contains(e.target)) {
                menu.classList.remove('dropdown-menu--open');
                buttonIcon.classList.remove('dropdown-button-icon--open');
            }
        });
    } else if (isSubscribersList || isBlockedList) {
        // Обработчики для кнопок подписчиков и заблокированных
        const actionButton = card.querySelector('.friend-card__btn');
        actionButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = actionButton.dataset.action;
            handleMenuAction(action, id, name, listType);
        });
    }

    return card;
}

function handleMenuAction(action, userId, userName, listType) {
    console.log(`Action: ${action}, User: ${userName} (${userId}), List: ${listType}`);
    
    switch (action) {
        case 'remove-friend':
            if (confirm(`Вы уверены, что хотите удалить ${userName} из друзей?`)) {
                console.log(`Удаляем пользователя ${userId} из друзей`);
            }
            break;
            
        case 'add-friend':
            if (confirm(`Добавить ${userName} в друзья?`)) {
                console.log(`Добавляем пользователя ${userId} в друзья`);
            }
            break;
            
        case 'block-user':
            if (confirm(`Вы уверены, что хотите заблокировать ${userName}?`)) {
                console.log(`Блокируем пользователя ${userId}`);
            }
            break;
            
        case 'unblock-user':
            if (confirm(`Разблокировать ${userName}?`)) {
                console.log(`Разблокируем пользователя ${userId}`);
            }
            break;
            
        default:
            console.log('Неизвестное действие:', action);
    }
}