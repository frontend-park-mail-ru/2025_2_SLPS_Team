import FriendsStatsTemplate from './FriendsStats.hbs';
import './FriendsStats.css';

export interface FriendsStatsContext {
    friendsCount?: number;
    subscribersCount?: number;
    possibleCount?: number;
    currentType?: 'friends' | 'subscribers' | 'possible';
}

export function renderFriendsStats(context: FriendsStatsContext = {}): HTMLElement {
    const {
        friendsCount = 0,
        subscribersCount = 0,
        possibleCount = 0,
        currentType = 'friends'
    } = context;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = FriendsStatsTemplate({
        friendsCount,
        subscribersCount,
        possibleCount,
        currentType
    });

    const statsElement = wrapper.firstElementChild as HTMLElement;

    const activeButton = statsElement.querySelector<HTMLElement>(`[data-type="${currentType}"]`);
    if (activeButton) {
        activeButton.classList.add('friends-stats__item--active');
    }

    return statsElement;
}
