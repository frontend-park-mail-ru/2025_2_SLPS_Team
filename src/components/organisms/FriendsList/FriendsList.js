import FriendsListTemplate from './FriendsList.hbs';
import { renderFriendCard } from '../../molecules/FriendCard/FriendCard.js';
import './FriendsList.css';

export function renderFriendsList(context = {}) {
    const { friends = [], listType = 'friends' } = context;

    const listElement = document.createElement('div');
    
    // Определяем заголовок в зависимости от типа списка
    let title = 'Ваши друзья';
    if (listType === 'subscribers') {
        title = 'Подписчики';
    } else if (listType === 'possible') {
        title = 'Возможные друзья';
    }
    
    listElement.innerHTML = FriendsListTemplate();
    
    const friendsList = listElement.firstElementChild;
    const gridContainer = friendsList.querySelector('.friends-list__grid');

    // Добавляем карточки друзей
    if (gridContainer) {
        friends.forEach(friend => {
            const friendCard = renderFriendCard({
                ...friend,
                listType: listType // Передаем тип списка для кастомизации кнопок
            });
            gridContainer.appendChild(friendCard);
        });
    }

    return friendsList;
}