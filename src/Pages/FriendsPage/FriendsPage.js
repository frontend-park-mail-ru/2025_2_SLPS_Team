import BasePage from '../BasePage.js';
import FriendsPageTemplate from './FriendsPage.hbs';
import { renderFriendsStats } from '../../components/molecules/FriendsStats/FriendsStats.js';
import { renderFriendsList } from '../../components/organisms/FriendsList/FriendsList.js';
import './FriendsPage.css';

async function getFriendsData(page = 1, limit = 20) {
    const requestsRes = await fetch(`${process.env.API_BASE_URL}/api/friends/requests?page=${page}`, {credentials: 'include'});

    const requestsData = await requestsRes.json();
    const requests = Array.isArray(requestsData) ? requestsData : (requestsData.requests || []);

    const subscribers = await Promise.all(requests.map(async (req) => {
        console.log(req)

        const profileRes = await fetch(`${process.env.API_BASE_URL}/api/profile/${req.userID}`, {
            credentials: 'include'
        });
        const profileData = await profileRes.json();

        return {
            userID: req.userID,
            name: req.fullName,
            age: profileData.dob ? calculateAge(profileData.dob) : null,
            avatarSrc: req.avatarPath || null,
            type: 'subscriber'
        };
    }));


    const friendsRes = await fetch(`${process.env.API_BASE_URL}/api/friends?page=${page}`, { credentials: 'include' });
    const friendsData = await friendsRes.json();

    const friends = await Promise.all((friendsData || []).map(async (friend) => {
        const profileRes = await fetch(`${process.env.API_BASE_URL}/api/profile/${friend.userID}`, { credentials: 'include' });
        const profileData = await profileRes.json();

        return {
            userID: friend.userID,
            name: friend.fullName,
            avatarPath: friend.avatarPath || null,
            age: profileData.dob ? calculateAge(profileData.dob) : null
        };
}));

    const possibleRes = await fetch(`${process.env.API_BASE_URL}/api/friends/users/all?page=${page}`,{credentials: 'include'});
    const possibleData = await possibleRes.json();

    const possible = await Promise.all((possibleData || []).map(async (user) => {
        const profileRes = await fetch(`${process.env.API_BASE_URL}/api/profile/${user.userID}`, {credentials: 'include'});
        const profileData = await profileRes.json();

        return {
            userID: user.userID,
            name: user.fullName,
            avatarPath: user.avatarPath || null,
            age: profileData.dob ? calculateAge(profileData.dob) : null,
            type: 'possible'
        };
    }));

    return {
        friends,
        subscribers,
        possible
    };
}

// Вспомогательная функция для вычисления возраста по дате рождения
function calculateAge(dobString) {
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}


export class FriendsPage extends BasePage {
    constructor(rootElement) {
        super(rootElement);
        this.currentListType = 'friends'; // 'friends', 'subscribers', 'possible'
        this.friendsData = {
            friends: [],
            subscribers: [],
            possible: []
        };
    }

    async render() {
        const existingWrapper = document.getElementById('page-wrapper');
        if (existingWrapper) existingWrapper.remove();

        const wrapper = document.createElement('div');
        wrapper.id = 'page-wrapper';
        
        let title = 'Ваши друзья';
            if (this.currentListType === 'subscribers') {
                title = 'Подписчики';
            } else if (this.currentListType === 'possible') {
                title = 'Возможные друзья';
            }
    

        const pageElement = document.createElement('div');
        pageElement.innerHTML = FriendsPageTemplate({title});
        const friendsPage = pageElement.firstElementChild;
        
        const contentContainer = friendsPage.querySelector('.friends-page__content');
        const sidebarContainer = friendsPage.querySelector('.friends-page__sidebar');
        
        await this.loadFriendsData();
        
        const friendsStats = renderFriendsStats({
            friendsCount: this.friendsData.friends.length,
            subscribersCount: this.friendsData.subscribers.length,
            possibleCount: this.friendsData.possible.length,
            currentType: this.currentListType
        });

        sidebarContainer.appendChild(friendsStats);
        this.addStatsEventListeners(sidebarContainer, contentContainer);
        
        const currentList = this.renderCurrentList();
        if (contentContainer && currentList) contentContainer.appendChild(currentList);

        wrapper.appendChild(friendsPage);
        this.rootElement.appendChild(wrapper);
    }

    async loadFriendsData() {
        this.friendsData = await getFriendsData();
    }

    renderCurrentList() {
        const data = this.friendsData[this.currentListType];
        if (!data) return null;

        return renderFriendsList({
            friends: data,
            listType: this.currentListType
        });
    }

    addStatsEventListeners(sidebarContainer, contentContainer) {
        const statsButtons = sidebarContainer.querySelectorAll('.friends-stats__item');
        
        statsButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const listType = event.currentTarget.dataset.type;
                if (listType && listType !== this.currentListType) {
                    this.currentListType = listType;
                    this.rerenderList(contentContainer, sidebarContainer);
                }
            });
        });
    }

    rerenderList(contentContainer, sidebarContainer) {
        const oldList = contentContainer.querySelector('.friends-list');
        if (oldList) oldList.remove();

        const newList = this.renderCurrentList();
        if (newList) contentContainer.appendChild(newList);

        const oldStats = sidebarContainer.querySelector('.friends-stats');
        if (oldStats) oldStats.remove();

        const newStats = renderFriendsStats({
            friendsCount: this.friendsData.friends.length,
            subscribersCount: this.friendsData.subscribers.length,
            possibleCount: this.friendsData.possible.length,
            currentType: this.currentListType
        });
        sidebarContainer.appendChild(newStats);
        this.addStatsEventListeners(sidebarContainer, contentContainer);
    }
}
