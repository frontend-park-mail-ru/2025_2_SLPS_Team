import NavbarTemplate from './Navbar.hbs';
import DropDown from '../../atoms/dropDown/dropDown.js';
import { navigateTo } from '../../../index.js';
import { authService } from '../../../services/AuthService.js';
import { NavbarSearchModal } from '../../molecules/NavbarSearchModal/NavbarSearchModal.js';

export async function renderNavbar(photo) {
    const baseUrl = `${process.env.API_BASE_URL}/uploads/`;
    let avatarPath;

    if (!photo || photo === 'null') {
        avatarPath = '/public/globalImages/DefaultAvatar.svg';
    } else {
        avatarPath = `${baseUrl}${photo}`;
    }

    const template = NavbarTemplate;
    const html = template({
        logo: '/public/globalImages/Logo.svg',
        profilePhoto: avatarPath,
        dropdownIcon: '/public/globalImages/DropdownIcon.svg',
        serachIcon: '/public/globalImages/SearchIcon.svg',
    });

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html.trim();

    const button = wrapper.querySelector('.dropdown-button');
    const buttonIcon = wrapper.querySelector('.dropdown-button-icon');
    const profileActionsConatiner = wrapper.querySelector('.navbar-profile-actions');

    const profileActions = new DropDown(profileActionsConatiner, {
        values: [
            {
                label: 'Профиль',
                icon: '/public/NavbarDropdown/SmallProfileIcon.svg',
                onClick: () => {
                    navigateTo('/profile');
                    buttonIcon.classList.remove('dropdown-button-icon--open');
                },
            },
            {
                label: 'Выход',
                icon: '/public/NavbarDropdown/logoutIcon.svg',
                onClick: async () => {
                    await authService.logout();
                    navigateTo('/');
                    buttonIcon.classList.remove('dropdown-button-icon--open');
                },
            },
        ],
    });

    profileActions.render();

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        profileActions.toggle();
        buttonIcon.classList.toggle('dropdown-button-icon--open');
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            profileActions.hide();
            buttonIcon.classList.remove('dropdown-button-icon--open');
        }
    });

    const searchContainer = wrapper.querySelector('.navbar-input-container');
    const searchInput = wrapper.querySelector('.navbar-input');
    const searchIcon = wrapper.querySelector('.navbar-input-icon');

    const searchModal = new NavbarSearchModal(searchContainer, baseUrl);
    searchModal.init(searchInput);

    searchIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        searchModal.toggle();
    });

    return wrapper;
}
