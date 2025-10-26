import { renderMenuItem } from '../../atoms/MenuItem/MenuItem.js';
import MenuTemplate from './Menu.hbs';
import { navigateTo } from '../../../index.js';

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

export async function renderMenu({ items }) {
    const template = MenuTemplate;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = template({});

    const sidebarMenu = wrapper.querySelector(".sidebar-menu");
    if (!sidebarMenu) throw new Error(".sidebar-menu не найден в шаблоне");

    const menuContainer = document.createElement("div");
    Object.assign(menuContainer.style, {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        width: "190px",
        position: "fixed"
    });

    const activeView = items.find(i => i.isActive)?.view || items[0].view;

    for (const item of items) {
        const menuItem = await renderMenuItem({
            ...item,
            isActive: item.view === activeView,
            onClick: async (view) => {
                items.forEach(i => i.isActive = i.view === view);

                const newMenu = await renderMenu({ items });
                sidebarMenu.replaceWith(newMenu.querySelector(".sidebar-menu"));

                const routesMap = {
                    feed: "/",
                    profile: "/profile",
                    friends: "/friends",
                    messenger: "/messenger",
                    community: "/community"
                };

                if (routesMap[view]) {
                    navigateTo(routesMap[view]);
                }

                if (item.onSelect) item.onSelect(view);
            }
        });

        menuContainer.appendChild(menuItem);
    }

    sidebarMenu.appendChild(menuContainer);

    return wrapper;
}
