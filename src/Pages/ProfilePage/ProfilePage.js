import BasePage from '../BasePage.js';
import { renderMenu } from '../../components/molecules/Menu/Menu.js';
import { renderFeed } from '../../components/organisms/Feed/Feed.js';
import { renderNavbar } from '../../components/molecules/Navbar/Navbar.js';
import ProfilePageTemplate from './ProfilePage.hbs';
import { EditProfileForm } from '../../components/organisms/EditProfileForm/EditProfileForm.js';
import {renderCommunitiesList} from '../../components/molecules/CommunitiesList/CommunitiesList.js';

async function getPosts(limit = 10, page = 1) {
    try {
        const params = new URLSearchParams({ limit, page });
        const res = await fetch(`${process.env.API_BASE_URL}/api/posts?${params.toString()}`);
        if (!res.ok) throw new Error("Ошибка HTTP " + res.status);
        return await res.json();
    } catch (err) {
        console.warn("Используем моковые посты, сервер недоступен", err);
    }
}

async function getProfileData(userId) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/user/${userId}`);
    if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

async function getFriendsData(userId) {
    const response = await fetch(`${process.env.API_BASE_URL}/api/friends/${userId}/count`);
    if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
    }
    const data = await response.json();
    return data;
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
    constructor(rootElement) {
        super(rootElement);
        this.posts = [];
        this.profileData = [];
        this.friendsData = [];
        this.defaultAvatar = "/public/globalImages/backgroud.png"
    }

    async render() {

        this.profileData = await getProfileData(1);
        this.friendsData = await getFriendsData(1);

        const { dobFormatted, age } = formatDob(this.profileData.User.dob);

        const templateData = {
            user: {
                ...this.profileData.User,
                dobFormatted,
                age,
                defaultAvatar: this.defaultAvatar,
            },
            friends: this.friendsData
        };

        const wrapper = document.createElement('div');
        wrapper.innerHTML = ProfilePageTemplate(templateData);
        const mainContainer = wrapper.querySelector('.profile-page');

        wrapper.querySelector('.profile-toggle-btn').addEventListener('click', () => {
            wrapper.querySelector('.profile-info').classList.toggle('expanded');
        });

        this.posts = await getPosts(10, 1);
        const feedElement = await renderFeed(this.posts.posts);
        const feedContainer = wrapper.querySelector('.profile-feed-container')
        feedContainer.appendChild(feedElement);

        const editButton = wrapper.querySelector('.edit-open');
        const EditProfileModal = new EditProfileForm(this.rootElement, templateData.user);
        if(editButton){
            editButton.addEventListener('click', () => {
                EditProfileModal.open();
            });
        }

        const communitiesList = await renderCommunitiesList();
        wrapper.querySelector('.folows-container').appendChild(communitiesList);

        this.rootElement.appendChild(wrapper);
    }
}