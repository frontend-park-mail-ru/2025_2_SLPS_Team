import MenuItemsTemplate from './MenuItem.hbs'

/**
 * Создаёт и возвращает HTML-элемент пункта меню.
 * Использует Handlebars-шаблон `MenuItem.hbs`.
 *
 * @async
 * @param {Object} options - Параметры пункта меню.
 * @param {string} options.label - Текст метки пункта меню.
 * @param {string} options.view - Идентификатор или название вида, связанного с пунктом.
 * @param {string|null} [options.icon=null] - Название или путь иконки для пункта меню.
 * @param {boolean} [options.isActive=false] - Флаг, указывающий, активен ли пункт меню.
 * @param {Function} [options.onClick] - Функция, вызываемая при клике на пункт меню; получает `view` как аргумент.
 * @returns {Promise<HTMLElement>} Promise, который разрешается в HTML-элемент пункта меню.
 *
 * @example
 * renderMenuItem({
 *   label: 'Главная',
 *   view: 'home',
 *   icon: 'home-icon',
 *   isActive: true,
 *   onClick: (view) => console.log('Перешли на', view)
 * }).then(menuItem => document.body.appendChild(menuItem));
 */
export async function renderMenuItem({ label, view, icon = null, isActive = false, onClick }) {
    const template = MenuItemsTemplate;
    const html = template({ label, view, icon, isActive });

    const wrapper = document.createElement("div");
    wrapper.innerHTML = html.trim();
    const menuItem = wrapper.firstElementChild;

    if (onClick) {
        menuItem.addEventListener("click", () => onClick(view));
    }

    return menuItem;
}
