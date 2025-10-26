import BasePage from '../BasePage.js';
import FriendsPageTemplate from './FriendsPage.hbs';
import { renderMenu } from '../../components/molecules/Menu/Menu.js';
import { renderFriendsStats } from '../../components/molecules/FriendsStats/FriendsStats.js';
import { renderFriendsList } from '../../components/organisms/FriendsList/FriendsList.js';
import { renderNavbar } from '../../components/molecules/Navbar/Navbar.js';
import { renderFriendsFilter } from '../../components/molecules/FriendsFilter/FriendsFilter.js';
import './FriendsPage.css';

/**
 * Функция для получения данных о друзьях с сервера
 */
async function getFriendsData() {
    try {
        const res = await fetch(`${process.env.API_BASE_URL}/api/friends`);
        if (!res.ok) throw new Error("Ошибка HTTP " + res.status);
        const data = await res.json();
        
        // Преобразуем данные в нужный формат
        return {
            friends: data.friends || [],
            subscribers: data.subscribers || [],
            blocked: data.blocked || []
        };
    } catch (err) {
        console.warn("Используем моковые данные, сервер недоступен", err);
        return null;
    }
}

export class FriendsPage extends BasePage {
    constructor(rootElement) {
        super(rootElement);
        this.friends = [];
        this.currentListType = 'friends'; // 'friends', 'subscribers', 'blocked'
        this.friendsData = {
            friends: [],
            subscribers: [],
            blocked: []
        };
        this.isSearchMenuOpen = false;
        this.filters = {
            minAge: '',
            maxAge: '',
            gender: 'any'
        };
        this.filterComponent = null; // Ссылка на компонент фильтра
    }

    async render() {
        // Очистка предыдущего контента
        document.querySelector('.navbar')?.remove();
        
        // Рендер навбара
        const navbarElement = await renderNavbar();
        document.body.appendChild(navbarElement);
        
        const existingWrapper = document.getElementById('page-wrapper');
        if (existingWrapper) {
            existingWrapper.remove();
        }

        const wrapper = document.createElement('div');
        wrapper.id = 'page-wrapper';
        
        // Рендер основной страницы
        const pageElement = document.createElement('div');
        pageElement.innerHTML = FriendsPageTemplate();
        const friendsPage = pageElement.firstElementChild;
        
        // Рендер меню
        const menuItems = [
            { label: "Профиль", view: "profile", icon: "/public/MenuIcons/ProfileIcon.svg" },
            { label: "Лента", view: "feed", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Сообщества", view: "community", icon: "/public/MenuIcons/FeedIcon.svg" },
            { label: "Мессенджер", view: "messenger", icon: "/public/MenuIcons/MessengerIcon.svg" },
            { label: "Друзья", view: "friends", icon: "/public/MenuIcons/FriendsIcon.svg", isActive: true }
        ];

        const menuElement = await renderMenu({ items: menuItems });
        
        // Получаем контейнеры
        const menuContainer = friendsPage.querySelector('.friends-page__menu');
        const contentContainer = friendsPage.querySelector('.friends-page__content');
        const sidebarContainer = friendsPage.querySelector('.friends-page__sidebar');
        const filterContainer = friendsPage.querySelector('.search-dropdown-menu');
        
        // Добавляем меню в специальный контейнер слева
        if (menuContainer) {
            menuContainer.appendChild(menuElement);
        }
        
        // Рендерим компонент фильтра
        if (filterContainer) {
            this.filterComponent = renderFriendsFilter({
                onFilterChange: this.handleFilterChange.bind(this),
                initialFilters: this.filters
            });
            filterContainer.appendChild(this.filterComponent);
        }
        
        // Получаем данные с сервера или используем моковые
        await this.loadFriendsData();
        
        // Создаем компоненты
        const friendsStats = renderFriendsStats({
            friendsCount: this.friendsData.friends.length,
            subscribersCount: this.friendsData.subscribers.length,
            blockedCount: this.friendsData.blocked.length,
            currentType: this.currentListType
        });

        // Рендерим текущий список
        const currentList = this.renderCurrentList();
        
        // Добавляем компоненты в соответствующие контейнеры
        if (contentContainer) {
            if (currentList) {
                contentContainer.appendChild(currentList);
            }
        }
        
        if (sidebarContainer) {
            sidebarContainer.appendChild(friendsStats);
            
            // Добавляем обработчики кликов на кнопки статистики
            this.addStatsEventListeners(sidebarContainer, contentContainer);
        }

        // Добавляем friends-page в wrapper
        wrapper.appendChild(friendsPage);
        
        this.rootElement.appendChild(wrapper);
        
        // Инициализируем выпадающее меню поиска
        this.initSearchDropdown();
    }

    /**
     * Обработчик изменения фильтров
     */
    handleFilterChange(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        console.log('Фильтры обновлены:', this.filters);
        this.applyFiltersAndRerender();
    }

    async loadFriendsData() {
        // Пытаемся получить данные с сервера
        const serverData = await getFriendsData();
        
        if (serverData) {
            // Используем данные с сервера
            this.friendsData = serverData;
            console.log('Данные загружены с сервера:', this.friendsData);
        } else {
            // Используем моковые данные
            this.generateMockData();
            console.log('Используются моковые данные');
        }
    }

    generateMockData() {
        // Друзья - создаем разнообразные данные для тестирования фильтров
        this.friendsData.friends = Array.from({ length: 9 }, (_, index) => ({
            id: index + 1,
            name: "Павловский Роман",
            age: 18 + (index % 10), // Возраст от 18 до 27
            avatarSrc: null,
            isOnline: Math.random() > 0.5,
            type: 'friend'
        }));

        // Подписчики
        this.friendsData.subscribers = Array.from({ length: 117 }, (_, index) => ({
            id: index + 1,
            name: "Подписчик " + (index + 1),
            age: 20 + (index % 15), // Возраст от 20 до 34
            avatarSrc: null,
            isOnline: Math.random() > 0.3,
            type: 'subscriber'
        }));

        // Заблокированные
        this.friendsData.blocked = Array.from({ length: 45 }, (_, index) => ({
            id: index + 1,
            name: "Заблокированный " + (index + 1),
            age: 25 + (index % 20), // Возраст от 25 до 44
            avatarSrc: null,
            isOnline: false,
            type: 'blocked'
        }));
    }

    renderCurrentList() {
        const data = this.friendsData[this.currentListType];
        if (!data) return null;

        // Применяем фильтры к данным
        const filteredData = this.applyFiltersToData(data);

        console.log(`Рендерим ${this.currentListType}:`, {
            всего: data.length,
            послеФильтрации: filteredData.length,
            фильтры: this.filters
        });

        return renderFriendsList({
            friends: filteredData,
            listType: this.currentListType
        });
    }

    applyFiltersToData(data) {
        if (!data) return [];

        return data.filter(friend => {
            // Фильтр по возрасту
            if (this.filters.minAge && friend.age < parseInt(this.filters.minAge)) {
                return false;
            }
            if (this.filters.maxAge && friend.age > parseInt(this.filters.maxAge)) {
                return false;
            }

            return true;
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

    async rerenderList(contentContainer, sidebarContainer) {
        // Удаляем старый список
        const oldList = contentContainer.querySelector('.friends-list');
        if (oldList) {
            oldList.remove();
        }

        // Рендерим новый список
        const newList = this.renderCurrentList();
        if (newList) {
            const searchBlock = contentContainer.querySelector('.search-input-container');
            if (searchBlock) {
                contentContainer.insertBefore(newList, searchBlock.nextSibling);
            } else {
                contentContainer.appendChild(newList);
            }
        }

        // Полностью перерендериваем статистику с новым активным состоянием
        const oldStats = sidebarContainer.querySelector('.friends-stats');
        if (oldStats) {
            oldStats.remove();
            
            const newStats = renderFriendsStats({
                friendsCount: this.friendsData.friends.length,
                subscribersCount: this.friendsData.subscribers.length,
                blockedCount: this.friendsData.blocked.length,
                currentType: this.currentListType
            });
            
            sidebarContainer.appendChild(newStats);
            
            // Добавляем обработчики заново
            this.addStatsEventListeners(sidebarContainer, contentContainer);
        }
    }

    initSearchDropdown() {
        const dropdownButton = document.querySelector('.dropdownf-button');
        const dropdownMenu = document.querySelector('.search-dropdown-menu');

        if (dropdownButton && dropdownMenu) {
            // Обработчик клика по кнопке
            dropdownButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleSearchMenu();
            });

            // Закрытие меню при клике вне его
            document.addEventListener('click', (e) => {
                if (!dropdownMenu.contains(e.target) && !dropdownButton.contains(e.target)) {
                    this.closeSearchMenu();
                }
            });
        }
    }

    toggleSearchMenu() {
        const dropdownMenu = document.querySelector('.search-dropdown-menu');
        const dropdownButton = document.querySelector('.dropdownf-button');

        this.isSearchMenuOpen = !this.isSearchMenuOpen;
        
        if (this.isSearchMenuOpen) {
            dropdownMenu.classList.add('search-dropdown-menu--open');
            dropdownButton.classList.add('dropdownf-button--open');
        } else {
            dropdownMenu.classList.remove('search-dropdown-menu--open');
            dropdownButton.classList.remove('dropdownf-button--open');
        }
    }

    closeSearchMenu() {
        const dropdownMenu = document.querySelector('.search-dropdown-menu');
        const dropdownButton = document.querySelector('.dropdownf-button');

        this.isSearchMenuOpen = false;
        dropdownMenu.classList.remove('search-dropdown-menu--open');
        dropdownButton.classList.remove('dropdownf-button--open');
    }

    applyFiltersAndRerender() {
        console.log('Применяем фильтры:', this.filters);
        
        // Перерендериваем список с примененными фильтрами
        const contentContainer = document.querySelector('.friends-page__content');
        const sidebarContainer = document.querySelector('.friends-page__sidebar');
        
        if (contentContainer && sidebarContainer) {
            this.rerenderList(contentContainer, sidebarContainer);
        }
    }

    clearFilters() {
        this.filters = {
            minAge: '',
            maxAge: '',
            gender: 'any'
        };
        
        // Сбрасываем значения в компоненте фильтра
        if (this.filterComponent) {
            const ageInputs = this.filterComponent.querySelectorAll('.age-input');
            const anyGenderRadio = this.filterComponent.querySelector('input[name="gender"][value="any"]');
            
            ageInputs.forEach(input => input.value = '');
            if (anyGenderRadio) anyGenderRadio.checked = true;
        }
        
        // Применяем изменения
        this.applyFiltersAndRerender();
    }
}