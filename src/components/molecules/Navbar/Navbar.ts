import NavbarTemplate from './Navbar.hbs';
import DropDown from '../../atoms/dropDown/dropDown';
import { navigateTo } from '../../../index';
import { authService } from '../../../services/AuthService';
import { NavbarSearchModal } from '../../molecules/NavbarSearchModal/NavbarSearchModal';
import { ToggleButton } from '../../atoms/ToggleButton/ToggleButton';

export function renderNavbar(photo?: string | null): HTMLElement {
  const baseUrl = `${process.env.API_BASE_URL}/uploads/`;

  const avatarPath =
    !photo || photo === 'null'
      ? '/public/globalImages/DefaultAvatar.svg'
      : `${baseUrl}${photo}`;

  const html = NavbarTemplate({
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

  if (!(button instanceof HTMLElement)) {
    throw new Error('[Navbar] .dropdown-button not found');
  }
  if (!(buttonIcon instanceof HTMLElement)) {
    throw new Error('[Navbar] .dropdown-button-icon not found');
  }
  if (!(profileActionsConatiner instanceof HTMLElement)) {
    throw new Error('[Navbar] .navbar-profile-actions not found');
  }

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

  const DropDownContainer = profileActionsConatiner.querySelector('.dropdown-menu') as HTMLElement;
  const toggleWrapper = document.createElement('div');
  toggleWrapper.className = 'dropdown-mode-devider';

  DropDownContainer.appendChild(toggleWrapper);
  new ToggleButton(DropDownContainer).render();

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    profileActions.toggle();
    buttonIcon.classList.toggle('dropdown-button-icon--open');
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof Node && !wrapper.contains(target)) {
      profileActions.hide();
      buttonIcon.classList.remove('dropdown-button-icon--open');
    }
  });

  const searchContainer = wrapper.querySelector('.navbar-input-container');
  const searchInput = wrapper.querySelector('.navbar-input');
  const searchIcon = wrapper.querySelector('.navbar-input-icon');

  if (searchContainer instanceof HTMLElement && searchInput instanceof HTMLInputElement) {
    const searchModal = new NavbarSearchModal(searchContainer, baseUrl);
    searchModal.init(searchInput);

    if (searchIcon instanceof HTMLElement) {
      searchIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        searchModal.toggle();
      });
    }
  }

  return wrapper;
}
