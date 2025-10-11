import NavbarTemplate from './Navbar.hbs';

export async function renderNavbar() {
    const template = NavbarTemplate;
    const html = template({ logo: '/public/globalImages/Logo.svg',
        profilePhoto: '/public/testData/Avatar.jpg',
        dropdownIcon: '/public/globalImages/DropdownIcon.svg',
        profileIcon: '/public/NavbarDropdown/SmallProfileIcon.svg',
        logoutIcon: '/public/NavbarDropdown/logoutIcon.svg',
        serachIcon: '/public/globalImages/SearchIcon.svg'
        });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();

    const button = wrapper.querySelector('.dropdown-button');
    const menu = wrapper.querySelector('.dropdown-menu');
    const buttonIcon = wrapper.querySelector('.dropdown-button-icon')

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('dropdown-menu--open');
        buttonIcon.classList.toggle('dropdown-button-icon--open')
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            menu.classList.remove('dropdown-menu--open');
            buttonIcon.classList.remove('dropdown-button-icon--open')
        }
    });

    return wrapper
}
