import FriendsStatsTemplate from './FriendsStats.hbs';
import './FriendsStats.css';

export function renderFriendsStats(context = {}) {
    const {
        friendsCount = 0,
        subscribersCount = 0,
        blockedCount = 0,
        currentType = 'friends'
    } = context;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = FriendsStatsTemplate({
        friendsCount,
        subscribersCount,
        blockedCount,
        currentType
    });
    
    const statsElement = wrapper.firstElementChild;
    
    // Добавляем активный класс программно
    const activeButton = statsElement.querySelector(`[data-type="${currentType}"]`);
    if (activeButton) {
        activeButton.classList.add('friends-stats__item--active');
    }
    
    return statsElement;
}