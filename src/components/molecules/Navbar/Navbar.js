import NavbarTemplate from './Navbar.hbs';

export async function renderNavbar() {
    const html = NavbarTemplate({
        logo: '/public/globalImages/Logo.svg',
        profilePhoto: '/public/testData/Avatar.jpg',
        dropdownIcon: '/public/globalImages/DropdownIcon.svg',
        profileIcon: '/public/NavbarDropdown/SmallProfileIcon.svg',
        logoutIcon: '/public/NavbarDropdown/logoutIcon.svg',
        serachIcon: '/public/globalImages/SearchIcon.svg'
    });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();

    const navbar = wrapper.firstElementChild; 

    const button = navbar.querySelector('.dropdown-button');
    const menu = navbar.querySelector('.dropdown-menu');
    const buttonIcon = navbar.querySelector('.dropdown-button-icon');

    button.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('dropdown-menu--open');
        buttonIcon.classList.toggle('dropdown-button-icon--open');
    });

    document.addEventListener('click', (e) => {
        if (!navbar.contains(e.target)) {
            menu.classList.remove('dropdown-menu--open');
            buttonIcon.classList.remove('dropdown-button-icon--open');
        }
    });

    return navbar; 
}
