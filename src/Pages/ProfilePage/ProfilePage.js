import BasePage from '../BasePage.js';
import { renderMenu } from '../../components/molecules/Menu/Menu.js';
import { renderFeed } from '../../components/organisms/Feed/Feed.js';
import { renderNavbar } from '../../components/molecules/Navbar/Navbar.js';
import ProfilePageTemplate from './ProfilePage.hbs';
import { EditProfileForm } from '../../components/organisms/EditProfileForm/EditProfileForm.js';
import {renderCommunitiesList} from '../../components/molecules/CommunitiesList/CommunitiesList.js';
import { authService } from '../../services/AuthService.js';
import { NotificationManager } from '../../components/organisms/NotificationsBlock/NotificationsManager.js';
import { ModalConfirm } from '../../components/molecules/ModalConfirm/ModalConfirm.js';
import { EventBus } from '../../services/EventBus.js';
import { navigateTo } from '../../index.js';

const notifier = new NotificationManager();

async function getPosts(limit = 10, page = 1) {
    try {
        const params = new URLSearchParams({ limit, page });
        const res = await fetch(`${process.env.API_BASE_URL}/api/posts?${params.toString()}`, {credentials: "include"});
        if (!res.ok) throw new Error("Ошибка HTTP " + res.status);
        return await res.json();
    } catch (err) {
        console.warn("Используем моковые посты, сервер недоступен", err);
    }
}

async function getProfileData(userId) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/profile/${userId}`, {credentials: "include"});
    if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

// async function getFriendsData(userId) {
//     const response = await fetch(`${process.env.API_BASE_URL}/api/friends/${userId}/count`);
//     if (!response.ok) {
//         throw new Error(`Ошибка запроса: ${response.status}`);
//     }
//     const data = await response.json();
//     return data;
// }
async function getFriendsData(userId) {
    return {
        count_friends: 12,
        count_followers: 34,
        count_follows: 56
    };
}
export async function getFriendsStatus(userId) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/friends/${userId}/status`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        }
    });

    const data = await response.json();
    return data.status;
}


function formatDob(dobStr) {
    const dob = new Date(dobStr);

    const dobFormatted = new Intl.DateTimeFormat('ru-RU').format(dob);

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }

    return { dobFormatted, age };
}


export class ProfilePage extends BasePage {
    constructor(rootElement, params) {
        super(rootElement);
        this.posts = [];
        this.profileData = [];
        this.friendsData = [];
        this.defaultAvatar = "/public/globalImages/backgroud.png"
        this.params = params;
        this.userId = null;
        this.isOwner = false;
        this.friendsStatus = null;
        this.wrapper = null;
    }

    async render() {

        this.checkId();
        this.profileData = await getProfileData(this.userId);
        this.friendsData = await getFriendsData(this.userId);

        const { dobFormatted, age } = formatDob(this.profileData.dob);

        if (!this.isOwner) {
            this.friendsStatus = await getFriendsStatus(this.userId);
        }

        const templateData = {
            user: {
                ...this.profileData,
                fullName: `${this.profileData.firstName} ${this.profileData.lastName}`,
                dobFormatted,
                age,
                defaultAvatar: this.defaultAvatar,
                isOwner: this.isOwner,
            },
            showCancelRequest: this.friendsStatus === 'pending',
            showMessage: this.friendsStatus === 'accepted',
            showAddFriend: this.friendsStatus === '',
            showBlocked: this.friendsStatus === 'blocked',
            friends: this.friendsData
        };
        console.log(this.isOwner);

        this.wrapper = document.createElement('div');
        this.wrapper.innerHTML = ProfilePageTemplate(templateData);
        const mainContainer = this.wrapper.querySelector('.profile-page');

        this.wrapper.querySelector('.profile-toggle-btn').addEventListener('click', () => {
            this.wrapper.querySelector('.profile-info').classList.toggle('expanded');
        });

        this.posts = await getPosts(10, 1);
        const feedElement = await renderFeed(this.posts);
        const feedContainer = this.wrapper.querySelector('.profile-feed-container')
        feedContainer.appendChild(feedElement);

        const editButton = this.wrapper.querySelector('.edit-open');
        if(editButton){
            const EditProfileModal = new EditProfileForm(this.rootElement, templateData.user);
            editButton.addEventListener('click', () => {
                EditProfileModal.open();
            });
        }

        this.addListners();

        const communitiesList = await renderCommunitiesList();
        this.wrapper.querySelector('.folows-container').appendChild(communitiesList);

        this.rootElement.appendChild(this.wrapper);
    }

    checkId() {
        if (this.params.id) {
            this.userId = Number(this.params.id);
            if (this.userId === Number(authService.getUserId())) {
                this.isOwner = true;
            }
        } else {
            this.userId = Number(authService.getUserId());
            this.isOwner = true;
        }
    }

    addListners() {
        const handleAddFriend = async (button) => {
            try {
                const response = await fetch(`${process.env.API_BASE_URL}/api/friends/${this.userId}`, { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    notifier.show("Ошибка", "Не удалось отправить заявку, попробуйте позже", "error");
                    return;
                }

                notifier.show("Заявка отправлена", "Заявка в друзья отправлена успешно", "success");
                button.textContent = "Заявка отправлена";
                button.classList.remove('add-friend-btn');
                button.classList.add('request-text');
                button.disabled = true;
            } catch (err) {
                console.error(err);
            }
        };

        const addFriendBtn = this.wrapper.querySelector('.add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => handleAddFriend(addFriendBtn), { once: true });
        }

        const messageBtn = this.wrapper.querySelector('.message-btn');
        if (messageBtn) {
            messageBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch(`${process.env.API_BASE_URL}/api/chats/user/${this.userId}`);
                    const data = await response.json();
                    const userId = this.userId;

                    navigateTo('/messanger');

                    setTimeout(() => {
                        EventBus.emit('openChat', { userId });
                    }, 100);
                } catch (err) {
                    console.error(err);
                }
            });
        }

        const unblockButton = this.wrapper.querySelector('.unblock-user-btn');
        if (unblockButton) {
            unblockButton.addEventListener('click', () => {
                const blockConfirm = new ModalConfirm(
                    "Подтвердите действие",
                    `Вы уверены, что хотите разблокировать пользователя ${this.profileData.firstName} ${this.profileData.lastName}?`,
                    async () => {
                        try {
                            console.log('тут надо дернуть ручку на разблокировку пользователя');

                            notifier.show(
                                'Пользователь разблокирован',
                                `Вы разблокировали пользователя ${this.profileData.firstName} ${this.profileData.lastName}`,
                                "success"
                            );

                            const newBtn = document.createElement('button');
                            newBtn.textContent = "Добавить в друзья";
                            newBtn.classList.add('add-friend-btn');
                            unblockButton.replaceWith(newBtn);

                            newBtn.addEventListener('click', () => handleAddFriend(newBtn), { once: true });

                        } catch (err) {
                            notifier.show("Ошибка", "Не удалось разблокировать пользователя", "error");
                            console.error(err);
                        }
                    }
                );

                blockConfirm.open();
            });
        }
    }

}
