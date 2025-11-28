import { renderMenuItem } from '../../atoms/MenuItem/MenuItem.js';
import MenuTemplate from './Menu.hbs';

/**
 * Рендерит боковое меню на основе массива элементов.
 * Использует Handlebars-шаблон `Menu.hbs` и функцию {@link renderMenuItem}.
 *
 * @async
 * @function renderMenu
 * @param {Object} params - Параметры функции.
 * @param {Array<Object>} params.items - Массив элементов меню.
 * @param {string} params.items[].label - Отображаемый текст пункта меню.
 * @param {string} params.items[].view - Идентификатор/ключ представления, связанный с пунктом меню.
 * @param {string} [params.items[].icon] - Иконка пункта меню (путь или название).
 * @param {boolean} [params.items[].isActive=false] - Флаг активности пункта.
 * @param {Function} [params.items[].onSelect] - Колбэк, вызываемый при выборе пункта меню. Получает `view` как аргумент.
 * @returns {Promise<HTMLElement>} Promise, который разрешается в корневой элемент меню (`wrapper`).
 *
 * @example
 * const menu = await renderMenu({
 *   items: [
 *     { label: "Главная", view: "home", isActive: true, onSelect: (v) => console.log("Выбрано:", v) },
 *     { label: "Профиль", view: "profile" },
 *     { label: "Настройки", view: "settings" }
 *   ]
 * });
 * document.body.appendChild(menu);
 */
export async function renderMenu({ items, onNavigate }) {
    const template = MenuTemplate;

    const wrapper = document.createElement("div"); 
    wrapper.innerHTML = template({});

    const sidebarMenu = wrapper.querySelector(".sidebar-menu");
    if (!sidebarMenu) throw new Error(".sidebar-menu не найден в шаблоне");

    const menuContainer = document.createElement("div");
    menuContainer.classList.add("menu-items-container");

    const activeView = items.find(i => i.isActive)?.view || window.location.pathname;

    for (const item of items) {
        const menuItem = await renderMenuItem({
            ...item,
            isActive: item.view === activeView,
            onClick: () => {
                items.forEach(i => i.isActive = i.view === item.view);

                const allItems = menuContainer.querySelectorAll('.menu-item');
                allItems.forEach(i => i.classList.remove('active'));
                const clickedItem = Array.from(allItems).find(el =>
                    el.querySelector('.menu-item-label')?.textContent === item.label
                );
                clickedItem?.classList.add('active');

                onNavigate?.(item.view);
            }
        });

        menuContainer.appendChild(menuItem);
    }
    sidebarMenu.appendChild(menuContainer);

    const sidebarContainer = wrapper.querySelector(".sidebar-container");
    wrapper.sidebarContainer = sidebarContainer;
    
    return wrapper;
}
